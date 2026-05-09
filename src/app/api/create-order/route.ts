import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Lazy require so Razorpay is not loaded at module-evaluation time during build
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const body = await request.json();
    const options = {
      amount: body.amount * 100, // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    return NextResponse.json(order);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not create Razorpay order", details: err }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
