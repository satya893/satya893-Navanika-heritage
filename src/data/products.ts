import { collection, getDocs, query, where, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '../firebase';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  secondaryImage?: string;
  description?: string;
  isTrending?: boolean;
  stock?: number;
  tags?: string[];
}

// Keep the old generation logic temporarily as a fallback in case DB is empty
const generateProducts = (category: string, count: number, startId: number): Product[] => {
  const products: Product[] = [];
  const adjectives = ['Royal', 'Elegant', 'Classic', 'Modern', 'Vintage', 'Artisan', 'Heritage', 'Silk', 'Velvet', 'Linen', 'Cotton', 'Chiffon', 'Georgette', 'Banarasi', 'Kanjeevaram', 'Zardosi', 'Embroidered', 'Hand-woven', 'Bespoke', 'Couture'];
  const nouns = {
    'Sarees': ['Saree', 'Drape', 'Ensemble', 'Heritage Piece', 'Classic Wrap'],
    'Formal': ['Gown', 'Evening Dress', 'Anarkali', 'Sharara Set', 'Formal Suit'],
    'Casual': ['Tunic', 'Kurta', 'Linen Set', 'Day Dress', 'Casual Wrap'],
    'Fashion': ['Fusion Set', 'Modern Silhouette', 'Trend Piece', 'Style Statement', 'Contemporary Wrap']
  };

  for (let i = 0; i < count; i++) {
    const adj = adjectives[(i * 7) % adjectives.length];
    const catNouns = nouns[category as keyof typeof nouns] || ['Piece'];
    const noun = catNouns[(i * 11) % catNouns.length];
    const id = (startId + i).toString();
    
    products.push({
      id,
      name: `${adj} ${noun} ${id}`,
      price: (((i * 13) % 15) + 1) * 100,
      category,
      image: `https://picsum.photos/seed/navanika-${category.toLowerCase()}-${id}/800/1200`,
      secondaryImage: `https://picsum.photos/seed/navanika-detail-${category.toLowerCase()}-${id}/800/1200`,
      description: `A masterpiece of ${category.toLowerCase()} wear, this ${adj.toLowerCase()} ${noun.toLowerCase()} is a testament to Navanika's commitment to heritage and elegance. Crafted with precision and passion.`,
      isTrending: (i % 3 === 0),
      stock: 100,
      tags: adj === 'Artisan' ? ['artisan'] : []
    });
  }
  return products;
};


export const ALL_PRODUCTS: Product[] = [
  ...generateProducts('Sarees', 60, 100),
  ...generateProducts('Formal', 60, 200),
  ...generateProducts('Casual', 60, 300),
  ...generateProducts('Fashion', 60, 400),
];

export const TRENDING_PRODUCTS = ALL_PRODUCTS.filter(p => p.isTrending);

// --- NEW FIRESTORE FETCH FUNCTIONS ---

export const fetchProducts = async (categoryStr?: string): Promise<Product[]> => {
  try {
    const productsRef = collection(db, 'products');
    let q = query(productsRef);

    if (categoryStr) {
      // Create a case-insensitive query for the category
      // Firestore doesn't support case-insensitive queries directly, so we'll fetch all and filter in JS
      q = query(productsRef);
    }

    const snapshot = await getDocs(q);
    console.log('Firestore snapshot size:', snapshot.size);
    let fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

    // Filter by category if specified (case-insensitive)
    if (categoryStr) {
      fetchedProducts = fetchedProducts.filter(p =>
        p.category.toLowerCase() === categoryStr.toLowerCase()
      );
      console.log('Filtered products for category', categoryStr, ':', fetchedProducts.length);
    }

    // If no products found in Firestore, fall back to generated products
    if (fetchedProducts.length === 0) {
      console.log('No products in Firestore, using fallback');
      return categoryStr ? ALL_PRODUCTS.filter(p => p.category.toLowerCase() === categoryStr.toLowerCase()) : ALL_PRODUCTS;
    }

    console.log('Returning', fetchedProducts.length, 'products from Firestore');

    // Sort in JS: Newest first
    fetchedProducts.sort((a: any, b: any) => {
      if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (a.createdAt) return -1;
      if (b.createdAt) return 1;
      return 0;
    });

    return fetchedProducts;
  } catch (error) {
    console.error("Error fetching products:", error);
    return categoryStr ? ALL_PRODUCTS.filter(p => p.category.toLowerCase() === categoryStr.toLowerCase()) : ALL_PRODUCTS;
  }
};

export const fetchTrendingProducts = async (): Promise<Product[]> => {
  try {
    console.log('Fetching trending products');
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where("isTrending", "==", true));

    const snapshot = await getDocs(q);
    console.log('Trending products snapshot size:', snapshot.size);
    if (snapshot.empty) {
      console.log('No trending products in Firestore, using fallback');
      return TRENDING_PRODUCTS.slice(0, 12);
    }

    const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    console.log('Found', fetchedProducts.length, 'trending products in Firestore');
    
    // Sort in JS: Newest first
    fetchedProducts.sort((a: any, b: any) => {
      if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (a.createdAt) return -1;
      if (b.createdAt) return 1;
      return 0;
    });

    return fetchedProducts.slice(0, 12);
  } catch (error) {
    console.error("Error fetching trending products:", error);
    return TRENDING_PRODUCTS.slice(0, 12);
  }
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, 'products', id);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Product;
    }
    return ALL_PRODUCTS.find(p => p.id === id) || null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return ALL_PRODUCTS.find(p => p.id === id) || null;
  }
};

export const fetchArtisanProducts = async (): Promise<Product[]> => {
  try {
    console.log('Fetching artisan products');
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where("tags", "array-contains", "artisan"), limit(12));

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log('No artisan products in Firestore, using fallback');
      return ALL_PRODUCTS.filter(p => p.tags?.includes('artisan')).slice(0, 12);
    }

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error("Error fetching artisan products:", error);
    return ALL_PRODUCTS.filter(p => p.tags?.includes('artisan')).slice(0, 12);
  }
};
