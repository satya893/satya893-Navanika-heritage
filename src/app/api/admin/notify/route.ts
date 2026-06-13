import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, sendUserNotificationAdmin, sendAdminNotificationServer, verifyAuthToken } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify admin authorization to prevent privilege escalation
    // middleware.ts only checks if token is valid, not if user is an admin
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await verifyAuthToken(token);
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map((e: string) => e.trim().toLowerCase()) || [];

    if (!decodedToken.email || !adminEmails.includes(decodedToken.email.toLowerCase())) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
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
  } catch (error: unknown) {
    console.error('Notification API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
