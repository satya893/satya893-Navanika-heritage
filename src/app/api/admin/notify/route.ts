import { NextResponse } from 'next/server';
import { dbAdmin, sendUserNotificationAdmin, sendAdminNotificationServer } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { type, userId, notification } = await request.json();

    if (type === 'broadcast') {
      const usersSnap = await dbAdmin.collection('users').get();

      const BATCH_SIZE = 500;
      const batches = [];
      let currentBatch = dbAdmin.batch();
      let operationCount = 0;

      const createdAt = new Date().toISOString();

      for (const userDoc of usersSnap.docs) {
        if (operationCount >= BATCH_SIZE) {
          batches.push(currentBatch.commit());
          currentBatch = dbAdmin.batch();
          operationCount = 0;
        }

        const notifRef = dbAdmin.collection('users').doc(userDoc.id).collection('notifications').doc();
        currentBatch.set(notifRef, {
          ...notification,
          isRead: false,
          createdAt
        });
        operationCount++;
      }

      // Also log in admin notifications for record
      if (operationCount >= BATCH_SIZE) {
        batches.push(currentBatch.commit());
        currentBatch = dbAdmin.batch();
        operationCount = 0;
      }

      const adminNotifRef = dbAdmin.collection('admin_notifications').doc();
      currentBatch.set(adminNotifRef, {
        title: `BROADCAST: ${notification.title}`,
        message: `You sent this message to all ${usersSnap.size} users.`,
        type: 'system',
        isRead: true, // Mark as read for admin by default since they sent it
        createdAt
      });
      batches.push(currentBatch.commit());

      await Promise.all(batches);
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
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Notification API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send notification' }, { status: 500 });
  }
}
