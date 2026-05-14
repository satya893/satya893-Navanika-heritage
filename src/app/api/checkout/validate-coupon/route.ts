import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const couponRef = dbAdmin.collection('coupons').doc(code.toUpperCase());
    const couponSnap = await couponRef.get();

    if (!couponSnap.exists) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    const couponData = couponSnap.data();

    if (!couponData?.isActive) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      discount: couponData.discount,
      code: code.toUpperCase()
    });

  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
