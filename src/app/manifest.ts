import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Navanika - Classic Heritage',
    short_name: 'Navanika',
    description: 'Discover the silent poetry of hand-woven silk and the timeless elegance of Indian craftsmanship.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A1128',
    theme_color: '#C5A059',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
