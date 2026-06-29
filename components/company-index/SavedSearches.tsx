'use client';

import React from 'react';
import { SavedSearch } from '@/types/company';
import { Bookmark, Clock, Trash2 } from 'lucide-react';

interface SavedSearchesProps {
    searches: SavedSearch[];
    onSelect: (search: SavedSearch) => void;
    onDelete: (id: string) => void;
}

export default function SavedSearches({ searches, onSelect, onDelete }: SavedSearchesProps) {
    if (searches.length === 0) return null;

    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <Bookmark size={14} className="text-red-600" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Saved Searches</h3>
            </div>
            <div className="flex flex-wrap gap-3">
                {searches.map(search => (
                    <div
                        key={search.id}
                        className="group flex items-center gap-4 px-4 py-3 bg-white dark:bg-[#0d0d0d] border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-red-600/30 transition-all cursor-pointer shadow-sm"
                        onClick={() => onSelect(search)}
                    >
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-tight">{search.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{search.zipCode} • {search.radiusMiles}mi • {search.verticalId}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 ml-2 border-l border-gray-100 dark:border-gray-800 pl-4">
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-black text-red-600">{search.resultCount}</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Results</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(search.id);
                                }}
                                className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
