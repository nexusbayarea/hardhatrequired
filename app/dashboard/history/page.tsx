'use client';

import { useState, useEffect } from 'react';
import {
  Clock, Search, Play, Trash2, Download, MapPin,
  Filter, ChevronRight, Database, ArrowUpRight
} from 'lucide-react';

interface SavedSearch {
  id: string;
  name: string;
  verticalId: string;
  zipCode: string;
  radiusMiles: number;
  resultCount: number;
  createdAt: string;
}

export default function SearchHistoryPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSearch, setSelectedSearch] = useState<SavedSearch | null>(null);
  const [filterVertical, setFilterVertical] = useState('all');
  const [replaying, setReplaying] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  async function fetchSavedSearches() {
    setLoading(true);
    try {
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      });
      const data = await res.json();
      setSearches(data.searches || []);
    } catch {
      console.error('Failed to fetch search history');
    } finally {
      setLoading(false);
    }
  }

  async function replaySearch(search: SavedSearch) {
    setReplaying(search.id);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-iie-client-context': search.verticalId,
        },
        body: JSON.stringify({
          zip: search.zipCode,
          radius: search.radiusMiles,
        }),
      });
      const data = await res.json();
      setSearches(prev => prev.map(s =>
        s.id === search.id
          ? { ...s, resultCount: data.companies?.length || 0 }
          : s
      ));
    } catch {
      console.error('Replay failed');
    } finally {
      setReplaying(null);
    }
  }

  async function deleteSearch(id: string) {
    try {
      await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      setSearches(prev => prev.filter(s => s.id !== id));
    } catch {
      console.error('Delete failed');
    }
  }

  const verticals = ['all', ...new Set(searches.map(s => s.verticalId))];
  const filteredSearches = filterVertical === 'all'
    ? searches
    : searches.filter(s => s.verticalId === filterVertical);

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Search History</h1>
        <p className="text-sm text-muted mt-1">Replay, export, or manage past market discoveries</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-4 flex-1">
          <StatCard icon={<Database className="w-4 h-4" />} label="Total Searches" value={searches.length} />
          <StatCard icon={<MapPin className="w-4 h-4" />} label="Unique Locations" value={new Set(searches.map(s => s.zipCode)).size} />
          <StatCard icon={<ArrowUpRight className="w-4 h-4" />} label="Total Results" value={searches.reduce((sum, s) => sum + s.resultCount, 0)} />
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface2 px-4 py-2 ml-4">
          <Filter className="w-4 h-4 text-muted" />
          <select
            value={filterVertical}
            onChange={(e) => setFilterVertical(e.target.value)}
            className="bg-transparent text-sm outline-none"
          >
            {verticals.map(v => (
              <option key={v} value={v} className="bg-bg">
                {v === 'all' ? 'All Verticals' : v.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted">Loading search history...</div>
      ) : filteredSearches.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-16 text-center">
          <Search className="mx-auto mb-4 w-12 h-12 text-muted/50" />
          <p className="text-muted">No saved searches yet.</p>
          <p className="mt-1 text-sm text-muted/50">Run a discovery from the dashboard to save it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSearches.map((search) => (
            <div
              key={search.id}
              onClick={() => setSelectedSearch(selectedSearch?.id === search.id ? null : search)}
              className={`cursor-pointer rounded-2xl border p-5 transition-all hover:border-border/80 ${
                selectedSearch?.id === search.id
                  ? 'border-red/50 bg-red/5'
                  : 'border-border bg-surface'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{search.name}</h3>
                    <span className="rounded-full bg-surface2 px-2.5 py-0.5 text-xs text-muted">
                      {search.verticalId.replace(/_/g, ' ')}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted/50">
                      <Clock className="w-3 h-3" />
                      {new Date(search.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {search.zipCode} &mdash; {search.radiusMiles}mi
                    </span>
                    <span className="flex items-center gap-1">
                      <Database className="w-3.5 h-3.5" />
                      {search.resultCount} results
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); replaySearch(search); }}
                    disabled={replaying === search.id}
                    className="rounded-lg bg-surface2 p-2 hover:bg-surface2/80 disabled:opacity-50"
                    title="Replay search"
                  >
                    {replaying === search.id ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted/30 border-t-text" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="rounded-lg bg-surface2 p-2 hover:bg-surface2/80"
                    title="Export results"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSearch(search.id); }}
                    className="rounded-lg bg-surface2 p-2 text-red hover:bg-red/10"
                    title="Delete search"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className={`w-5 h-5 text-muted/30 transition-transform ${
                    selectedSearch?.id === search.id ? 'rotate-90' : ''
                  }`} />
                </div>
              </div>

              {selectedSearch?.id === search.id && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted/50">Search ID</span>
                      <p className="mt-1 font-mono text-xs">{search.id}</p>
                    </div>
                    <div>
                      <span className="text-muted/50">Created</span>
                      <p className="mt-1">{new Date(search.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted/50">Query Parameters</span>
                      <p className="mt-1 text-muted">
                        ZIP: {search.zipCode} | Radius: {search.radiusMiles}mi
                      </p>
                    </div>
                    <div>
                      <span className="text-muted/50">Last Results</span>
                      <p className="mt-1 text-muted">{search.resultCount} companies discovered</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-2 text-muted">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}
