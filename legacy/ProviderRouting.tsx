'use client';

import React, { useState } from 'react';
import { User, Phone, Mail, DollarSign, ToggleLeft, ToggleRight, Plus, Send } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  serviceType: string;
  city: string;
  phone: string;
  email: string;
  pricePerLead: number;
  active: boolean;
}

const MOCK_PROVIDERS: Provider[] = [
  { id: '1', name: 'Elite Roofing Co', serviceType: 'Roofing', city: 'Austin', phone: '555-1001', email: 'elite@roofing.com', pricePerLead: 45, active: true },
  { id: '2', name: 'Cool Air HVAC', serviceType: 'HVAC', city: 'Houston', phone: '555-1002', email: 'cool@air.com', pricePerLead: 35, active: true },
  { id: '3', name: 'Quick Fix Plumbing', serviceType: 'Plumbing', city: 'Dallas', phone: '555-1003', email: 'quick@plumb.com', pricePerLead: 40, active: false },
  { id: '4', name: 'Bright Electric', serviceType: 'Electrical', city: 'San Antonio', phone: '555-1004', email: 'bright@elec.com', pricePerLead: 50, active: true },
];

export default function ProviderRouting() {
  const [providers, setProviders] = useState<Provider[]>(MOCK_PROVIDERS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: '', serviceType: 'Roofing', city: '', phone: '', email: '', pricePerLead: 30
  });

  const toggleActive = (id: string) => {
    setProviders(providers.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const addProvider = () => {
    const provider: Provider = {
      id: Date.now().toString(),
      ...newProvider,
      active: true
    };
    setProviders([...providers, provider]);
    setShowAddForm(false);
    setNewProvider({ name: '', serviceType: 'Roofing', city: '', phone: '', email: '', pricePerLead: 30 });
  };

  return (
    <div className="bg-white dark:bg-[#0d0d0d] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Provider Directory</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage service providers & routing</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all"
        >
          <Plus size={16} /> Add Provider
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-6 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input placeholder="Provider Name" className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm" value={newProvider.name} onChange={e => setNewProvider({...newProvider, name: e.target.value})} />
            <select className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm" value={newProvider.serviceType} onChange={e => setNewProvider({...newProvider, serviceType: e.target.value})}>
              <option>Roofing</option>
              <option>HVAC</option>
              <option>Plumbing</option>
              <option>Electrical</option>
            </select>
            <input placeholder="City" className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm" value={newProvider.city} onChange={e => setNewProvider({...newProvider, city: e.target.value})} />
            <input placeholder="Phone" className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm" value={newProvider.phone} onChange={e => setNewProvider({...newProvider, phone: e.target.value})} />
            <input placeholder="Email" type="email" className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm" value={newProvider.email} onChange={e => setNewProvider({...newProvider, email: e.target.value})} />
            <input placeholder="Price per Lead ($)" type="number" className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm" value={newProvider.pricePerLead} onChange={e => setNewProvider({...newProvider, pricePerLead: Number(e.target.value)})} />
            <button onClick={addProvider} className="col-span-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all">Save Provider</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <th className="pb-4">Provider</th>
              <th className="pb-4">Service</th>
              <th className="pb-4">City</th>
              <th className="pb-4">Contact</th>
              <th className="pb-4">Price/Lead</th>
              <th className="pb-4">Status</th>
              <th className="pb-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {providers.map(provider => (
              <tr key={provider.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-black/20 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <User size={16} className="text-gray-400" />
                    </div>
                    <span className="font-bold">{provider.name}</span>
                  </div>
                </td>
                <td className="py-4">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-bold">{provider.serviceType}</span>
                </td>
                <td className="py-4 text-sm text-gray-500">{provider.city}</td>
                <td className="py-4">
                  <div className="text-sm">
                    <div className="flex items-center gap-1 text-gray-500"><Phone size={12} /> {provider.phone}</div>
                    <div className="flex items-center gap-1 text-gray-400"><Mail size={12} /> {provider.email}</div>
                  </div>
                </td>
                <td className="py-4">
                  <span className="flex items-center gap-1 font-bold text-green-600"><DollarSign size={14} />{provider.pricePerLead}</span>
                </td>
                <td className="py-4">
                  <button onClick={() => toggleActive(provider.id)} className="flex items-center gap-1">
                    {provider.active ? (
                      <><ToggleRight size={24} className="text-green-500" /> <span className="text-xs font-bold text-green-600">Active</span></>
                    ) : (
                      <><ToggleLeft size={24} className="text-gray-400" /> <span className="text-xs font-bold text-gray-400">Inactive</span></>
                    )}
                  </button>
                </td>
                <td className="py-4">
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all">
                    <Send size={12} /> Assign Lead
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
