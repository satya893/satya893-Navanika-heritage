import { NextResponse } from 'next/server';
import { dbAdmin, sendUserNotificationAdmin, sendAdminNotificationServer, verifyAuthToken } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    // Check Authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await verifyAuthToken(token);
    const userEmail = decodedToken.email?.toLowerCase() || '';
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];

    if (!adminEmails.includes(userEmail)) {
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
  } catch (error: any) {
    console.error('Notification API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send notification' }, { status: 500 });
  }
}
