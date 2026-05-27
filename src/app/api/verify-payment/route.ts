import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('RAZORPAY_KEY_SECRET not configured');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    const bodyText = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = bodyText;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing required payment fields' },
        { status: 400 }
      );
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const signatureBuffer = Buffer.from(razorpay_signature, 'hex');
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex');

    let isAuthentic = false;
    if (signatureBuffer.length === expectedSignatureBuffer.length) {
      isAuthentic = crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer);
    }

    if (isAuthentic) {
      console.log(`Payment verified for order ${razorpay_order_id}`);
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
    } else {
      console.warn(`Invalid signature for order ${razorpay_order_id}`);
      return NextResponse.json(
        { success: false, message: 'Invalid payment signature' },
        { status: 401 }
      );
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    return NextResponse.json(
      { success: false, message: 'Verification failed', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
