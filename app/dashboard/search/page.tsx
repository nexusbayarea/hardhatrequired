'use client';

import { useState, useCallback } from 'react';
import SearchConsole from '@/components/dashboard/SearchConsole';
import ResultsTable from '@/components/dashboard/ResultsTable';
import MarketReportCard from '@/components/dashboard/MarketReportCard';
import ProviderHealthCard from '@/components/dashboard/ProviderHealthCard';
import UsageCard from '@/components/dashboard/UsageCard';
import type { SearchResult } from '@/types/search';

export default function SearchPage() {
  const [searchData, setSearchData] = useState<{ companies: SearchResult[]; count: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResults = useCallback((data: { companies: SearchResult[]; count: number }) => {
    setSearchData(data);
    setLoading(false);
  }, []);

  const handleSearchStart = useCallback(() => {
    setLoading(true);
  }, []);

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Search</h1>
        <p className="text-sm text-muted mt-1">Discover and enrich target companies</p>
      </div>

      <div className="w-full relative z-10">
        <SearchConsole onResults={handleResults} onSearchStart={handleSearchStart} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 w-full min-w-0 overflow-hidden">
          <ResultsTable
            companies={searchData?.companies}
            loading={loading}
          />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <MarketReportCard
            marketSize={searchData?.count ? `${searchData.count} companies` : undefined}
            opportunityIndex={searchData?.companies?.length ? Math.round(searchData.companies.filter(c => c.leadScore >= 70).length / searchData.companies.length * 100) : undefined}
          />
          <ProviderHealthCard />
          <UsageCard />
        </div>
      </div>
    </div>
  );
}
