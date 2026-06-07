import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, cartItems } = body as {
      userId: string;
      cartItems: Array<{ id: string }>;
    };

    const authUserId = request.headers.get('x-user-id');
    if (!authUserId || authUserId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!userId || !Array.isArray(cartItems)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const batch = dbAdmin.batch();
    const cartCol = dbAdmin.collection('users').doc(userId).collection('cart');

    for (const item of cartItems) {
      if (!item?.id) continue;
      batch.delete(cartCol.doc(item.id));
    }

    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

