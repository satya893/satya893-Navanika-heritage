import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, cartItems } = body as {
      userId: string;
      cartItems: Array<{ productId: string; quantity: number; size?: string | null }>;
    };

    if (!userId || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Verify stock exists and is sufficient
    const updates: Array<{ productId: string; currentStock: number; requested: number }> = [];

    for (const item of cartItems) {
      if (!item?.productId) {
        return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
      }
      const qty = Number(item.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
      }

      const productSnap = await dbAdmin.collection('products').doc(item.productId).get();
      if (!productSnap.exists) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
      }

      const product = productSnap.data() as any;
      const stock = Number(product.stock ?? 0);

      if (stock < qty) {
        return NextResponse.json({
          error: 'Insufficient stock',
          productId: item.productId,
          currentStock: stock,
          requested: qty,
        }, { status: 409 });
      }

      updates.push({ productId: item.productId, currentStock: stock, requested: qty });
    }

    return NextResponse.json({ success: true, items: updates });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Stock check failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

