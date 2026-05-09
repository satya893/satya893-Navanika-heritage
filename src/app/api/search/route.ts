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

    const snapshot = await productsQuery.get();
    let results = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Perform text search and price filtering
    if (q) {
      results = results.filter((p: any) => 
        p.name?.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    if (minPrice > 0 || maxPrice < Infinity) {
      results = results.filter((p: any) => 
        p.price >= minPrice && p.price <= maxPrice
      );
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
