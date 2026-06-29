'use client';

import React, { useState } from 'react';
import { Building2, Phone, Mail, DollarSign, CheckCircle2, XCircle, Search, MapPin } from 'lucide-react';
import { Facility, MOCK_FACILITIES } from '@/lib/types';

export default function FacilityDirectory() {
    const [facilities, setFacilities] = useState<Facility[]>(MOCK_FACILITIES);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFacilities = facilities.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white dark:bg-[#0d0d0d] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Facility Directory</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage verified disposal locations</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search facilities..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800">
                            <th className="pb-4 pr-4">Facility</th>
                            <th className="pb-4 pr-4">Material Type</th>
                            <th className="pb-4 pr-4">City</th>
                            <th className="pb-4 pr-4">Distance</th>
                            <th className="pb-4 pr-4">Contact</th>
                            <th className="pb-4 pr-4 text-center">Verified</th>
                            <th className="pb-4 pr-4 text-right">Price/Load</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFacilities.map(facility => (
                            <tr key={facility.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-black/20 transition-colors">
                                <td className="py-4 pr-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                            <Building2 size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm leading-tight">{facility.name}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">{facility.address}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 pr-4">
                                    <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                                        {facility.facilityType}
                                    </span>
                                </td>
                                <td className="py-4 pr-4">
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-600 dark:text-gray-400">
                                        <MapPin size={12} className="text-gray-400" />
                                        {facility.city}
                                    </div>
                                </td>
                                <td className="py-4 pr-4 text-xs font-bold text-gray-400">
                                    {facility.distanceMiles} miles
                                </td>
                                <td className="py-4 pr-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                            <Phone size={10} className="text-gray-300" /> {facility.phone}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 italic">
                                            <Mail size={10} className="text-gray-300" /> {facility.email}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 pr-4 text-center">
                                    <div className="flex justify-center">
                                        {facility.verified ? (
                                            <CheckCircle2 size={18} className="text-green-500" />
                                        ) : (
                                            <XCircle size={18} className="text-amber-500 opacity-40" />
                                        )}
                                    </div>
                                </td>
                                <td className="py-4 text-right">
                                    <span className="inline-flex items-center gap-0.5 font-black text-sm text-green-600 dark:text-green-400">
                                        <DollarSign size={14} />{facility.pricePerLoad || '---'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
