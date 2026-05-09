import { NextResponse } from 'next/server';
import { dbAdmin, sendUserNotificationAdmin, sendAdminNotificationServer } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, action, reason, details, type } = body;

    if (!orderId || !action) {
      return NextResponse.json({ error: 'Missing orderId or action' }, { status: 400 });
    }

    const orderRef = dbAdmin.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderSnap.data();

    if (action === 'cancel_request') {
      await orderRef.update({
        status: 'cancellation_pending',
        cancellationRequest: {
          reason: reason || 'User requested cancellation',
          type: type || 'refund',
          status: 'pending',
          requestedAt: new Date().toISOString()
        }
      });

      // Notify User
      await sendUserNotificationAdmin(orderData?.userId, {
        title: 'Cancellation Requested',
        message: `Your cancellation request for Order #${orderId.toUpperCase()} has been submitted.`,
        type: 'order',
        link: `/order/${orderId}`
      });

      // Notify Admin
      await sendAdminNotificationServer({
        title: 'Cancellation Requested',
        message: `Order #${orderId.toUpperCase()} has a pending cancellation request.`,
        type: 'order',
        orderId: orderId
      });

      return NextResponse.json({ success: true, message: 'Cancellation request submitted' });
    }

    if (action === 'return_request') {
      await orderRef.update({
        returnRequest: {
          type: type || 'return',
          reason: reason || 'No reason provided',
          details: details || '',
          status: 'pending',
          requestedAt: new Date().toISOString()
        }
      });

      // Notify User
      await sendUserNotificationAdmin(orderData?.userId, {
        title: `${type === 'exchange' ? 'Exchange' : 'Return'} Requested`,
        message: `Your ${type} request for Order #${orderId.toUpperCase()} has been received.`,
        type: 'order',
        link: `/order/${orderId}`
      });

      // Notify Admin
      await sendAdminNotificationServer({
        title: `${type === 'exchange' ? 'Exchange' : 'Return'} Requested`,
        message: `Order #${orderId.toUpperCase()} has a pending ${type} request.`,
        type: 'order',
        orderId: orderId
      });

      return NextResponse.json({ success: true, message: 'Return request submitted' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err: any) {
    console.error('[order-action] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
