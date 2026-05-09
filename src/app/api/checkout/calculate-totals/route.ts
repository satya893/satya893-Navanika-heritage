import { NextResponse } from 'next/server';

const GST_RATE = 0.05; // 5% GST for apparel/sarees

export async function POST(request: Request) {
  try {
    const { items, pincode } = await request.json();

    if (!items || !Array.isArray(items) || !pincode) {
      return NextResponse.json({ error: 'Missing items or pincode' }, { status: 400 });
    }

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * GST_RATE;

    // Shiprocket Mock Calculation
    // In a real app, you'd call Shiprocket's /courier/serviceability/external/
    // based on weight and dimensions. For now, we mock based on pincode.
    let shippingFee = 99; // Base national shipping

    const pinPrefix = pincode.substring(0, 2);
    const localPrefixes = ['40']; // Mumbai area example
    const regionalPrefixes = ['41', '42', '43', '44']; // Maharashtra example

    if (localPrefixes.includes(pinPrefix)) {
      shippingFee = 40; // Local Mumbai
    } else if (regionalPrefixes.includes(pinPrefix)) {
      shippingFee = 65; // Regional Maharashtra
    }

    // Free shipping for luxury orders above 5000
    if (subtotal > 5000) {
      shippingFee = 0;
    }

    const total = subtotal + tax + shippingFee;

    return NextResponse.json({
      subtotal,
      tax,
      shippingFee,
      total,
      gstRate: GST_RATE * 100
    });
  } catch (error: any) {
    console.error('Calculation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
