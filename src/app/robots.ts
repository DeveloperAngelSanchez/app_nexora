import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.nexoratechpe.store';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/nxd-92f/',
          '/nxd-92f',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
