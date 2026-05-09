import { NextResponse } from 'next/server';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ALL_PRODUCTS } from '../../../data/products';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const batch = writeBatch(db);
    const productsRef = collection(db, 'products');

    let count = 0;
    for (const product of ALL_PRODUCTS) {
      // Use the existing ID so images and logic stay consistent
      const docRef = doc(productsRef, product.id);
      batch.set(docRef, product);
      count++;
    }

    await batch.commit();

    return NextResponse.json({ success: true, message: `Successfully seeded ${count} products to Firestore!` });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
