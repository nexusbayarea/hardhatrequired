'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Target, DollarSign, ArrowUpRight } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState({
    totalLeads: 156,
    qualifiedLeads: 42,
    revenue: 4250,
    closeRate: 27
  });

  const [chartData] = useState([
    { name: 'Mon', revenue: 400, leads: 12 },
    { name: 'Tue', revenue: 700, leads: 18 },
    { name: 'Wed', revenue: 500, leads: 15 },
    { name: 'Thu', revenue: 900, leads: 22 },
    { name: 'Fri', revenue: 1200, leads: 30 },
    { name: 'Sat', revenue: 850, leads: 24 },
    { name: 'Sun', revenue: 600, leads: 16 },
  ]);

  const [revenueByCity] = useState([
    { city: 'Austin', revenue: 1850, leads: 45 },
    { city: 'Houston', revenue: 1200, leads: 38 },
    { city: 'Dallas', revenue: 950, leads: 32 },
    { city: 'San Antonio', revenue: 700, leads: 28 },
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: stats.totalLeads, icon: <Users size={20} />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Qualified', value: stats.qualifiedLeads, icon: <Target size={20} />, color: 'text-red-600 bg-red-50 dark:bg-red-900/30' },
          { label: 'Total Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: <DollarSign size={20} />, color: 'text-green-600 bg-green-50 dark:bg-green-900/30' },
          { label: 'Close Rate', value: `${stats.closeRate}%`, icon: <TrendingUp size={20} />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#0d0d0d] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>{stat.icon}</div>
              <div className="flex items-center text-green-500 text-xs font-bold"><ArrowUpRight size={14}/> +12%</div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
            <h3 className="text-3xl font-black mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#0d0d0d] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Revenue Trend</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis hide />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Line type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={4} dot={{r: 6, fill: '#dc2626', strokeWidth: 0}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d0d0d] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Lead Volume</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                <Bar dataKey="leads" fill="#000000" radius={[10, 10, 10, 10]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0d0d0d] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Revenue by City</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {revenueByCity.map((item, i) => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-black/40 rounded-2xl">
              <p className="text-xs font-bold text-gray-400 mb-1">{item.city}</p>
              <p className="text-2xl font-black text-green-600">${item.revenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{item.leads} leads</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
