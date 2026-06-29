'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Building2, ShieldCheck, DollarSign, Map, ArrowUpRight } from 'lucide-react';

export default function MarketIntelligenceDashboard() {
    const [stats] = useState({
        facilitiesIndexed: 1420,
        facilitiesVerified: 856,
        avgDisposalCost: 115,
        coverageArea: 12500
    });

    const [trendData] = useState([
        { name: 'Jan', cost: 125, facilities: 850 },
        { name: 'Feb', cost: 122, facilities: 920 },
        { name: 'Mar', cost: 118, facilities: 1050 },
        { name: 'Apr', cost: 115, facilities: 1180 },
        { name: 'May', cost: 115, facilities: 1300 },
        { name: 'Jun', cost: 115, facilities: 1420 },
    ]);

    const [costByCity] = useState([
        { city: 'Bakersfield', cost: 120, facilities: 124 },
        { city: 'Fresno', cost: 140, facilities: 156 },
        { city: 'Stockton', cost: 108, facilities: 98 },
        { city: 'Sacramento', cost: 155, facilities: 210 },
    ]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Facilities Indexed', value: stats.facilitiesIndexed.toLocaleString(), icon: <Building2 size={20} />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
                    { label: 'Facilities Verified', value: stats.facilitiesVerified.toLocaleString(), icon: <ShieldCheck size={20} />, color: 'text-green-600 bg-green-50 dark:bg-green-900/30' },
                    { label: 'Avg Disposal Cost', value: `$${stats.avgDisposalCost}`, icon: <DollarSign size={20} />, color: 'text-red-600 bg-red-50 dark:bg-red-900/30' },
                    { label: 'Coverage Area', value: `${stats.coverageArea.toLocaleString()} sq mi`, icon: <Map size={20} />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-[#0d0d0d] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.color}`}>{stat.icon}</div>
                            <div className="flex items-center text-green-500 text-xs font-bold"><ArrowUpRight size={14} /> +{i === 2 ? '0' : '8'}%</div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                        <h3 className="text-3xl font-black mt-1 tracking-tighter">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#0d0d0d] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Average Disposal Cost ($/Load)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                <YAxis hide />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Line type="monotone" dataKey="cost" stroke="#dc2626" strokeWidth={4} dot={{ r: 6, fill: '#dc2626', strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0d0d0d] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Facility Indexing Growth</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                <Bar dataKey="facilities" fill="#000000" radius={[10, 10, 10, 10]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0d0d0d] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Market Price Benchmarks by City</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {costByCity.map((item, i) => (
                        <div key={i} className="p-4 bg-gray-50 dark:bg-black/40 rounded-2xl">
                            <p className="text-xs font-bold text-gray-400 mb-1">{item.city}</p>
                            <p className="text-2xl font-black text-red-600">${item.cost}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{item.facilities} Registered Facilities</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
