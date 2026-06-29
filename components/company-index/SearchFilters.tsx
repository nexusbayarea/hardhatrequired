'use client';

import React from 'react';
import { Search, MapPin, Layers } from 'lucide-react';

interface SearchFiltersProps {
    filters: {
        industry: string;
        zip: string;
        radius: number;
    };
    onFilterChange: (filters: any) => void;
    onSearch: () => void;
}

export default function SearchFilters({ filters, onFilterChange, onSearch }: SearchFiltersProps) {
    const industries = ['Waste Disposal', 'Contractors', 'Industrial Services', 'Logistics'];
    const radiuses = [10, 15, 20, 25, 50];

    return (
        <div className="bg-white dark:bg-[#0d0d0d] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Industry</label>
                    <div className="relative">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <select
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-sm font-medium appearance-none"
                            value={filters.industry}
                            onChange={(e) => onFilterChange({ ...filters, industry: e.target.value })}
                        >
                            {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Zip Code</label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="e.g. 94544"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-sm font-medium"
                            value={filters.zip}
                            onChange={(e) => onFilterChange({ ...filters, zip: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Radius (Miles)</label>
                    <div className="flex gap-2">
                        {radiuses.map(r => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => onFilterChange({ ...filters, radius: r })}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${filters.radius === r ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'border-gray-100 dark:border-gray-800 text-gray-400'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={onSearch}
                    className="w-full py-3.5 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                >
                    <Search size={18} /> Search Index
                </button>
            </div>
        </div>
    );
}
