import { describe, it, expect } from 'vitest';
import { generateBaseGraph } from '../../src/lib/seo/schema-generator';

describe('Schema.org Knowledge Graph Generator', () => {
  it('generates a valid linked @graph with Organization, WebSite, and BreadcrumbList', () => {
    const graph = generateBaseGraph({
      canonicalUrl: 'https://visualstyleeditor.com/features',
      title: 'Technical Features — Visual Style Editor',
      description: 'Explore the 6 core engines of Visual Style Editor.',
      breadcrumbs: [
        { name: 'Home', item: 'https://visualstyleeditor.com/' },
        { name: 'Features', item: 'https://visualstyleeditor.com/features' }
      ]
    });

    expect(graph['@context']).toBe('https://schema.org');
    expect(Array.isArray(graph['@graph'])).toBe(true);

    const types = graph['@graph'].map((entity: any) => entity['@type']);
    expect(types).toContain('Organization');
    expect(types).toContain('WebSite');
    expect(types).toContain('BreadcrumbList');

    const org = graph['@graph'].find((e: any) => e['@type'] === 'Organization');
    expect(org['@id']).toBe('https://visualstyleeditor.com/#organization');
    expect(org.name).toBe('Amoga Media');

    const breadcrumbs = graph['@graph'].find((e: any) => e['@type'] === 'BreadcrumbList');
    expect(breadcrumbs.itemListElement).toHaveLength(2);
    expect(breadcrumbs.itemListElement[0].name).toBe('Home');
    expect(breadcrumbs.itemListElement[1].name).toBe('Features');
  });

  it('merges custom route-specific schemas into the @graph', () => {
    const customEntity = {
      '@type': 'FAQPage',
      '@id': 'https://visualstyleeditor.com/support#faq',
      'mainEntity': []
    };

    const graph = generateBaseGraph({
      canonicalUrl: 'https://visualstyleeditor.com/support',
      title: 'Support',
      description: 'Help',
      customEntities: [customEntity]
    });

    const faq = graph['@graph'].find((e: any) => e['@type'] === 'FAQPage');
    expect(faq).toBeDefined();
    expect(faq['@id']).toBe('https://visualstyleeditor.com/support#faq');
  });
});
