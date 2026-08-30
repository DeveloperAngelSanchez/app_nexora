import React from 'react';
import { Product, Category } from '@/types';
import { PublicSiteSettings } from '@/lib/settings';

interface JsonLdProps {
  data: Record<string, any> | Array<Record<string, any>>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Builds Google-compliant Schema.org Product markup with Offer and AggregateRating
 */
export function buildProductSchema(product: Product, baseUrl = 'https://www.nexoratechpe.store') {
  const productUrl = `${baseUrl}/producto/${product.slug}`;
  const images = product.images && product.images.length > 0
    ? product.images
    : [`${baseUrl}/icons/icon-512x512.png`];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.name,
    description: product.description || `Comprar ${product.name} en NeXora Store Perú con garantía y envío inmediato.`,
    image: images,
    url: productUrl,
    sku: product.id,
    mpn: product.barcode || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'NeXora Tech',
    },
    category: product.categoryName || 'Tecnología',
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'PEN',
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: productUrl,
      seller: {
        '@type': 'Organization',
        name: 'NeXora Store Perú',
        url: baseUrl,
      },
    },
    ...(product.rating > 0 && product.reviewCount > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  };
}

/**
 * Builds Schema.org BreadcrumbList for SERP rich breadcrumbs
 */
export function buildBreadcrumbSchema(
  items: { name: string; url: string }[],
  baseUrl = 'https://www.nexoratechpe.store'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url.startsWith('/') ? '' : '/'}${item.url}`,
    })),
  };
}

/**
 * Builds Schema.org Organization / OnlineStore markup
 */
export function buildOrganizationSchema(
  settings?: PublicSiteSettings,
  baseUrl = 'https://www.nexoratechpe.store'
) {
  const storeName = settings?.store_name || 'NeXora Store';
  const phone = settings?.whatsapp_number || '+51999999999';

  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${baseUrl}/#organization`,
    name: storeName,
    url: baseUrl,
    logo: `${baseUrl}/icons/icon-512x512.png`,
    image: `${baseUrl}/icons/icon-512x512.png`,
    description: 'Tienda online oficial en Perú especializada en tecnología, accesorios móviles, audio y gadgets con envíos a nivel nacional.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'PE',
      addressLocality: 'Lima',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: phone,
      contactType: 'customer service',
      areaServed: 'PE',
      availableLanguage: ['Spanish'],
    },
    sameAs: [
      settings?.social_instagram || 'https://www.instagram.com',
      settings?.social_facebook || 'https://www.facebook.com',
      settings?.social_tiktok || 'https://www.tiktok.com',
    ].filter(Boolean),
  };
}

/**
 * Builds Schema.org WebSite with Sitelinks Searchbox
 */
export function buildWebSiteSchema(baseUrl = 'https://www.nexoratechpe.store') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: baseUrl,
    name: 'NeXora Store',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/catalogo?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Builds Schema.org FAQPage markup
 */
export function buildFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Builds Schema.org ItemList for Collection/Category pages
 */
export function buildCollectionSchema(
  categoryName: string,
  products: Product[],
  baseUrl = 'https://www.nexoratechpe.store'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${categoryName} en Perú | Catálogo y Ofertas`,
    url: baseUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 10).map((prod, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${baseUrl}/producto/${prod.slug}`,
        name: prod.name,
      })),
    },
  };
}
