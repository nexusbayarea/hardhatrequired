import { NextRequest, NextResponse } from 'next/server';
import { getVerticalConfigByDomain } from '@/lib/market/registry';
import { Company, Contact } from '@/types/company';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companies, contacts }: { companies: Company[]; contacts?: Contact[] } = body;

    if (!companies || !Array.isArray(companies)) {
      return NextResponse.json(
        { error: 'Invalid payload: Array of standardized company objects required.' },
        { status: 400 }
      );
    }

    const clientHeader = req.headers.get('x-iie-client-context');
    if (!clientHeader) {
      return NextResponse.json(
        { error: 'X-IIE-Client-Context header is required for processing data exports.' },
        { status: 401 }
      );
    }

    const verticalConfig = await getVerticalConfigByDomain(clientHeader);
    if (!verticalConfig) {
      return NextResponse.json(
        { error: 'Invalid or unregistered client configuration context.' },
        { status: 403 }
      );
    }

    const targetEquipmentLabel = `${verticalConfig.industryName} Asset Signals`;
    const headers = [
      'ID',
      'Company Name',
      'Industry Vertical',
      'Website',
      'Phone',
      'Email',
      'Address',
      'City',
      'State',
      'Zip',
      'Distance (Miles)',
      'Priority Group',
      'MIE Score',
      'Status',
      'Contact Person',
      'Contact Title',
      'LinkedIn Profile',
      targetEquipmentLabel
    ];

    const csvRows = [headers.join(',')];
    const contactsByCompany = new Map<string, Contact[]>();
    if (contacts) {
      for (const c of contacts) {
        const existing = contactsByCompany.get(c.companyId) || [];
        existing.push(c);
        contactsByCompany.set(c.companyId, existing);
      }
    }

    for (const c of companies) {
      const escape = (val: any) => {
        if (val === null || val === undefined) return '""';
        const stringified = String(val).replace(/"/g, '""');
        return `"${stringified}"`;
      };

      const companyContacts = contactsByCompany.get(c.id) || [];
      const primary = companyContacts.find(ct => ct.isPrimary) || companyContacts[0];
      const contactPerson = primary ? [primary.firstName, primary.lastName].filter(Boolean).join(' ') : '';
      const contactTitle = primary?.title || '';
      const linkedInUrl = primary?.linkedinUrl || '';

      const row = [
        escape(c.id),
        escape(c.companyName),
        escape(verticalConfig.industryName),
        escape(c.website),
        escape(c.phone),
        escape(c.email),
        escape(c.address),
        escape(c.city),
        escape(c.state),
        escape(c.zip),
        escape(c.distanceMiles),
        escape(c.priority),
        escape(c.enrichmentScore),
        escape(c.status),
        escape(contactPerson),
        escape(contactTitle),
        escape(linkedInUrl),
        escape(c.capabilitySummary)
      ];

      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const base64Data = Buffer.from(csvContent).toString('base64');
    const downloadUrl = `data:text/csv;base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      tenant: verticalConfig.id,
      fileName: `${verticalConfig.id}-market-index.csv`,
      url: downloadUrl
    });
  } catch (err: any) {
    console.error("Export System Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
