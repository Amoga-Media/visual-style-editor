export interface BreadcrumbItem {
  name: string;
  item: string;
}

export interface BaseGraphOptions {
  canonicalUrl: string;
  title: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
  customEntities?: Record<string, any>[];
}

export function generateBaseGraph(options: BaseGraphOptions) {
  const { canonicalUrl, title, description, breadcrumbs = [], customEntities = [] } = options;

  const orgEntity = {
    '@type': 'Organization',
    '@id': 'https://visualstyleeditor.com/#organization',
    'name': 'Amoga Media',
    'url': 'https://visualstyleeditor.com',
    'logo': {
      '@type': 'ImageObject',
      '@id': 'https://visualstyleeditor.com/#logo',
      'url': 'https://visualstyleeditor.com/favicon.svg',
      'caption': 'Visual Style Editor by Amoga Media'
    },
    'sameAs': [
      'https://github.com/amoga-media',
      'https://amogamedia.com'
    ],
    'publishingPrinciples': 'https://visualstyleeditor.com/why-we-do-what-we-do',
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'technical support',
      'email': 'support@visualstyleeditor.com',
      'availableLanguage': ['English']
    }
  };

  const websiteEntity = {
    '@type': 'WebSite',
    '@id': 'https://visualstyleeditor.com/#website',
    'name': 'Visual Style Editor',
    'url': 'https://visualstyleeditor.com',
    'description': 'In-browser visual HTML and Tailwind CSS style editor with surgical AST splicing and direct disk sync.',
    'inLanguage': 'en-US',
    'publisher': {
      '@id': 'https://visualstyleeditor.com/#organization'
    }
  };

  const graph: any[] = [orgEntity, websiteEntity];

  if (breadcrumbs.length > 0) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumbs`,
      'itemListElement': breadcrumbs.map((crumb, idx) => ({
        '@type': 'ListItem',
        'position': idx + 1,
        'name': crumb.name,
        'item': crumb.item
      }))
    });
  }

  for (const entity of customEntities) {
    graph.push(entity);
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph
  };
}
