import { NextResponse } from 'next/server';
import { dbAdmin, sendUserNotificationAdmin, sendAdminNotificationServer, verifyAuthToken } from '@/lib/firebase-admin';
import { cookies, headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    // 🛡️ SECURITY: Authorization check
    // The middleware checks if a token is valid, but doesn't check if the user is an admin.
    // We must verify the user has admin/moderator privileges to use this endpoint.
    const headersList = await headers();
    const cookiesList = await cookies();

    const token = headersList.get('authorization')?.replace('Bearer ', '') ||
                  cookiesList.get('token')?.value ||
                  cookiesList.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const decodedToken = await verifyAuthToken(token);
    const userEmail = decodedToken.email?.toLowerCase();

    const userDoc = await dbAdmin.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];
    const isAdmin = userData?.role === 'admin' || userData?.role === 'moderator' || (userEmail ? adminEmails.includes(userEmail) : false);

    if (!isAdmin) {
      console.error(`[SECURITY] User ${decodedToken.uid} (${userEmail}) attempted to access admin notify endpoint without authorization.`);
      return NextResponse.json({ error: 'Forbidden - Requires admin privileges' }, { status: 403 });
    }

    const { type, userId, notification } = await request.json();

    if (type === 'broadcast') {
      const usersSnap = await dbAdmin.collection('users').get();
      const promises = usersSnap.docs.map(userDoc => 
        dbAdmin.collection('users').doc(userDoc.id).collection('notifications').add({
          ...notification,
          isRead: false,
          createdAt: new Date().toISOString()
        })
      );
      
      // Also log in admin notifications for record
      promises.push(
        dbAdmin.collection('admin_notifications').add({
          title: `BROADCAST: ${notification.title}`,
          message: `You sent this message to all ${usersSnap.size} users.`,
          type: 'system',
          isRead: true, // Mark as read for admin by default since they sent it
          createdAt: new Date().toISOString()
        })
      );

      await Promise.all(promises);
      return NextResponse.json({ success: true, message: 'Broadcast sent' });
    }

    if (type === 'targeted') {
      await sendUserNotificationAdmin(userId, notification);
      return NextResponse.json({ success: true, message: 'Targeted notification sent' });
    }

    if (type === 'admin') {
      await sendAdminNotificationServer(notification);
      return NextResponse.json({ success: true, message: 'Admin alert sent' });
    }

    return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
  } catch (error: any) {
    console.error('Notification API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send notification' }, { status: 500 });
  }
}
