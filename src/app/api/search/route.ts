import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase() || '';
    const category = searchParams.get('category');
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || 'Infinity');

    let productsQuery: any = dbAdmin.collection('products');

    // Apply category filter if present
    if (category && category !== 'all') {
      productsQuery = productsQuery.where('category', '==', category);
    }

    // Bolt: Delegate price filtering to database to reduce payload and execution time
    if (minPrice > 0) {
      productsQuery = productsQuery.where('price', '>=', minPrice);
    }

    if (maxPrice < Infinity) {
      productsQuery = productsQuery.where('price', '<=', maxPrice);
    }

    const snapshot = await productsQuery.get();
    let results = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Perform text search
    if (q) {
      results = results.filter((p: any) => 
        p.name?.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
