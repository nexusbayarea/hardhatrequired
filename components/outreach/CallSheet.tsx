'use client';

import React from 'react';
import { Company } from '@/types/company';
import { Phone, CheckCircle2, AlertCircle, XCircle, FileText } from 'lucide-react';

interface CallSheetProps {
    companies: Company[];
    isOpen: boolean;
    onClose: () => void;
}

export default function CallSheet({ companies, isOpen, onClose }: CallSheetProps) {
    if (!isOpen) return null;

    const priorities = ['A', 'B', 'C'] as const;

    const getCompaniesByPriority = (priority: string) => companies.filter(c => c.priority === priority);
    const priorityLabel = (p: string) => p === 'A' ? '0-10 miles' : p === 'B' ? '10-15 miles' : '15-20 miles';

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="bg-white dark:bg-[#0f0f0f] w-full max-w-4xl rounded-[2.5rem] p-8 md:p-10 border border-gray-200 dark:border-gray-800 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white flex items-center justify-center text-white dark:text-black">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tighter uppercase">Call Sheet Generated</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                {companies.length} Targeted Prospects
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-black dark:hover:text-white font-bold uppercase text-[10px] tracking-widest border border-gray-100 dark:border-gray-800 px-4 py-2 rounded-xl">
                        Close Sheet
                    </button>
                </div>

                <div className="overflow-y-auto pr-2 space-y-8 custom-scrollbar">
                    {priorities.map(priority => {
                        const priorityCompanies = getCompaniesByPriority(priority);
                        if (priorityCompanies.length === 0) return null;

                        return (
                            <div key={priority}>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${priority === 'A' ? 'bg-green-100 text-green-700' :
                                        priority === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {priority}
                                    </span>
                                    <h3 className="font-black uppercase tracking-widest text-xs text-gray-500">
                                        Priority {priority} <span className="font-medium normal-case ml-2">({priorityLabel(priority)})</span>
                                    </h3>
                                    <div className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800" />
                                    <span className="text-[10px] font-bold text-gray-400">{priorityCompanies.length} companies</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {priorityCompanies.map(company => (
                                        <div key={company.id} className="p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-red-600/30 transition-all flex justify-between items-center group">
                                            <div>
                                                <div className="font-bold text-sm mb-1 group-hover:text-red-600 transition-colors">{company.companyName}</div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Phone size={10} /> {company.phone}
                                                </div>
                                            </div>
                                            <button className="p-3 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-gray-400 hover:text-red-600 hover:border-red-600 transition-all">
                                                <Phone size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Ready for outreach campaign
                    </div>
                    <button className="px-8 py-3 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
                        Start Call Session
                    </button>
                </div>
            </div>
        </div>
    );
}
