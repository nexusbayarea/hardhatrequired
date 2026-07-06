import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    news: [],
    status: 'building_index',
    message: 'Industry news feed is being built from regulatory filings and procurement updates.',
  });
}
