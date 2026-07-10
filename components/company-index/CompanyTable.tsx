'use client';

import React from 'react';
import { Company } from '@/types/company';
import { Building2, Phone, Mail, Globe, MapPin, Download, FileText } from 'lucide-react';

interface CompanyTableProps {
    companies: Company[];
    onGenerateCallSheet: () => void;
    onExportCSV: () => void;
    onStatusChange: (id: string, status: Company['status']) => void;
}

export default function CompanyTable({ companies, onGenerateCallSheet, onExportCSV, onStatusChange }: CompanyTableProps) {
    const getStatusLabel = (status: Company['status']) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="bg-white dark:bg-[#0d0d0d] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Market Index</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {companies.length} companies matched in your area
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onExportCSV}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                    <button
                        onClick={onGenerateCallSheet}
                        className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all"
                    >
                        <FileText size={14} /> Generate Call Sheet
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800">
                            <th className="pb-4 pr-4">Company</th>
                            <th className="pb-4 pr-4">Priority</th>
                            <th className="pb-4 pr-4">Distance</th>
                            <th className="pb-4 pr-4">Contact</th>
                            <th className="pb-4 pr-4">Website</th>
                            <th className="pb-4 pr-4 text-right">Outreach Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.map(company => (
                            <tr key={company.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-black/20 transition-colors group">
                                <td className="py-4 pr-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                            <Building2 size={16} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm leading-tight">{company.companyName}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{company.city}, {company.zip}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 pr-4">
                                    <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-black uppercase ${company.priority === 'A' ? 'bg-green-100 text-green-700' :
                                        company.priority === 'B' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        Priority {company.priority}
                                    </div>
                                </td>
                                <td className="py-4 pr-4">
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-600 dark:text-gray-400">
                                        <MapPin size={12} className="text-gray-400" />
                                        {company.distanceMiles} mi
                                    </div>
                                </td>
                                <td className="py-4 pr-4">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{company.phone}</span>
                                        <span className="text-xs italic text-gray-400 truncate max-w-[120px]">{company.email}</span>
                                    </div>
                                </td>
                                <td className="py-4 pr-4">
                                    {company.website && (
                                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors">
                                            <Globe size={16} />
                                        </a>
                                    )}
                                </td>
                                <td className="py-4 text-right">
                                    <select
                                        className={`text-xs font-black uppercase py-1.5 px-3 rounded-lg border focus:ring-2 focus:ring-red-500/20 outline-none transition-all appearance-none cursor-pointer ${company.status === 'WON' ? 'bg-green-600 text-white border-green-700' :
                                            company.status === 'INTERESTED' ? 'bg-blue-600 text-white border-blue-700' :
                                                company.status === 'NOT_CONTACTED' ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700' :
                                                    'bg-red-50 dark:bg-red-900/10 text-red-600 border-red-100 dark:border-red-900/30'
                                            }`}
                                        value={company.status}
                                        onChange={(e) => onStatusChange(company.id, e.target.value as Company['status'])}
                                    >
                                        {['NOT_CONTACTED', 'CALLED', 'EMAILED', 'INTERESTED', 'FOLLOW_UP', 'QUALIFIED', 'WON', 'LOST'].map(status => (
                                            <option key={status} value={status}>{getStatusLabel(status as Company['status'])}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
