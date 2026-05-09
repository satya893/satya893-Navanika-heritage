import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const reviewsSnap = await dbAdmin.collection('reviews')
      .where('productId', '==', productId)
      .orderBy('createdAt', 'desc')
      .get();

    const reviews = reviewsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, userId, userName, userImage, rating, comment } = body;

    if (!productId || !userId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const reviewData = {
      productId,
      userId,
      userName: userName || 'Anonymous',
      userImage: userImage || null,
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date().toISOString()
    };

    const docRef = await dbAdmin.collection('reviews').add(reviewData);

    return NextResponse.json({ id: docRef.id, ...reviewData });
  } catch (error: any) {
    console.error('Error adding review:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
