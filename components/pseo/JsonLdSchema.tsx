import type { PseoPageData } from '@/lib/pseo/types';
import { formatCitySlug, formatStateSlug } from '@/lib/pseo/utils';

interface Props {
  data: PseoPageData;
  citySlug: string;
  stateSlug: string;
}

export default function JsonLdSchema({ data, citySlug, stateSlug }: Props) {
  const city = formatCitySlug(citySlug);
  const state = formatStateSlug(stateSlug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${data.vertical_name} in ${city}, ${state}`,
    description: `Top-rated ${data.vertical_name.toLowerCase()} contractors and service providers in ${city}, ${state}.`,
    areaServed: {
      '@type': 'City',
      name: city,
      containedInPlace: {
        '@type': 'State',
        name: state,
      },
    },
    provider: data.vendors?.map(v => ({
      '@type': 'LocalBusiness',
      name: v.company_name,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
