import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase() || '';
    const category = searchParams.get('category');
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || 'Infinity');
    const limit = parseInt(searchParams.get('limit') || '0', 10);

    let productsQuery: any = dbAdmin.collection('products');

    // Apply category filter if present
    if (category && category !== 'all') {
      productsQuery = productsQuery.where('category', '==', category);
    }

    // Since text search/price filtering is done in-memory, we can't apply
    // the Firestore .limit() directly if we have complex filters.
    // However, if there are no complex text/price filters, we can apply limit at the DB level.
    const hasTextSearch = q.length > 0;
    const hasPriceFilter = minPrice > 0 || maxPrice < Infinity;

    if (!hasTextSearch && !hasPriceFilter && limit > 0) {
      productsQuery = productsQuery.limit(limit);
    }

    const snapshot = await productsQuery.get();
    let results = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Perform text search and price filtering
    if (hasTextSearch) {
      results = results.filter((p: any) => 
        p.name?.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    if (hasPriceFilter) {
      results = results.filter((p: any) => 
        p.price >= minPrice && p.price <= maxPrice
      );
    }

    // Apply limit if specified and we had to filter in-memory
    if ((hasTextSearch || hasPriceFilter) && limit > 0) {
      results = results.slice(0, limit);
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
