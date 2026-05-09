import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Testing Firestore connection...');
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);

    return NextResponse.json({
      success: true,
      message: 'Firestore connected successfully',
      productCount: snapshot.size,
      products: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    });
  } catch (error: any) {
    console.error('Firestore test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}