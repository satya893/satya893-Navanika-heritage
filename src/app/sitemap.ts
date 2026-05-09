import { MetadataRoute } from 'next';
import { dbAdmin } from '@/lib/firebase-admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://navanika.com';

  // Base pages
  const staticPages = [
    '',
    '/category/sarees',
    '/category/lehengas',
    '/category/jewelry',
    '/category/artisan',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }));

  try {
    // Fetch all products for the sitemap
    const productsSnap = await dbAdmin.collection('products').get();
    const productPages = productsSnap.docs.map((doc: any) => ({
      url: `${baseUrl}/product/${doc.id}`,
      lastModified: new Date(doc.data().createdAt || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticPages, ...productPages];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return staticPages;
  }
}
