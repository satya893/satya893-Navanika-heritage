import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbAdmin } from '../../../../lib/firebase-admin';

export async function POST(request: Request) {
  try {
    // Validate webhook secret exists
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature') as string;

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature securely to prevent timing attacks
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature || '', 'utf8');
    const expectedSignatureBuffer = Buffer.from(expectedSignature || '', 'utf8');

    let isSignatureValid = false;
    if (signatureBuffer.length === expectedSignatureBuffer.length) {
      isSignatureValid = crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer);
    }

    if (!isSignatureValid) {
      console.warn('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    
    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const orderId = event.payload.payment.entity.order_id;
      const paymentId = event.payload.payment.entity.id;

      // Update order status in Firestore
      await dbAdmin.collection('orders').doc(orderId).update({
        status: 'paid',
        razorpayPaymentId: paymentId,
        paidAt: new Date(),
      });

      console.log(`Order ${orderId} marked as paid`);
    }

    // Handle payment.failed event
    if (event.event === 'payment.failed') {
      const orderId = event.payload.payment.entity.order_id;
      await dbAdmin.collection('orders').doc(orderId).update({
        status: 'payment_failed',
        failureReason: event.payload.payment.entity.error_description,
        failedAt: new Date(),
      });

      console.log(`Order ${orderId} payment failed`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json(
      { error: 'Webhook error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 }
    );
  }
}

export const dynamic = 'force-dynamic';
