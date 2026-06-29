import { NextRequest, NextResponse } from 'next/server';
import { enrichCompanyData } from '@/lib/market/enrich';
import { getVerticalConfigByDomain } from '@/lib/market/registry';
import { Company } from '@/types/company';

export async function POST(req: NextRequest) {
  try {
    const company: Partial<Company> = await req.json();
    if (!company.id || !company.companyName) {
      return NextResponse.json({ error: 'Invalid or missing corporate record payload.' }, { status: 400 });
    }

    const clientOrigin = req.headers.get('x-iie-client-context');
    if (!clientOrigin) {
      return NextResponse.json(
        { error: 'X-IIE-Client-Context header is required.' },
        { status: 401 }
      );
    }

    const verticalConfig = await getVerticalConfigByDomain(clientOrigin);
    if (!verticalConfig) {
      return NextResponse.json(
        { error: `Invalid or unregistered client configuration: '${clientOrigin}'` },
        { status: 403 }
      );
    }

    const enrichment = await enrichCompanyData(company as Company);

    return NextResponse.json({
      ...enrichment,
      vertical: verticalConfig.id ?? null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
