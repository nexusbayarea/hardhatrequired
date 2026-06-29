'use client';

import React, { useState } from 'react';
import { X, Save, Loader2, Zap } from 'lucide-react';
import * as Engine from '@/lib/engine';

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadSaved?: () => void;
}

export default function LeadCaptureModal({ isOpen, onClose, onLeadSaved }: LeadCaptureModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    serviceType: 'Roofing',
    city: '',
    budget: 'Medium',
    timeline: 'ASAP',
    source: 'Facebook Marketplace',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await Engine.processLead(formData.notes, { 
        ...formData,
        metadata: { client_side_entry: true }
      });
      
      if (result.success) {
        alert(`Lead Saved! AI Score: ${result.ai_score}`);
        onLeadSaved?.();
        onClose();
        setFormData({
          name: '',
          phone: '',
          serviceType: 'Roofing',
          city: '',
          budget: 'Medium',
          timeline: 'ASAP',
          source: 'Facebook Marketplace',
          notes: ''
        });
      }
    } catch (error) {
      console.error("Capture Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0f0f0f] w-full max-w-2xl rounded-[2.5rem] p-8 md:p-12 border border-gray-200 dark:border-gray-800 shadow-2xl relative overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-400 hover:text-black dark:hover:text-white"><X size={24}/></button>
        
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white">
            <Zap size={24} />
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Capture Lead</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Name</label>
            <input required className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:border-red-600 outline-none transition-all" 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone</label>
            <input required type="tel" className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:border-red-600 outline-none transition-all" 
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Service Type</label>
            <select className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:border-red-600 outline-none transition-all appearance-none"
              value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})}>
              <option>Roofing</option>
              <option>HVAC</option>
              <option>Plumbing</option>
              <option>Electrical</option>
              <option>Painting</option>
              <option>Landscaping</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">City</label>
            <input required className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:border-red-600 outline-none transition-all" 
              value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Budget</label>
            <div className="flex gap-2">
              {['Low', 'Medium', 'High'].map(b => (
                <button key={b} type="button" onClick={() => setFormData({...formData, budget: b})}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${formData.budget === b ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 dark:border-gray-800'}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Timeline</label>
            <select className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:border-red-600 outline-none transition-all appearance-none"
              value={formData.timeline} onChange={e => setFormData({...formData, timeline: e.target.value})}>
              <option>ASAP</option>
              <option>This Week</option>
              <option>Later</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Source</label>
            <select className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:border-red-600 outline-none transition-all appearance-none"
              value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
              <option>Facebook Marketplace</option>
              <option>Google Ads</option>
              <option>Website Form</option>
              <option>Referral</option>
              <option>Direct Call</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes / Requirements</label>
            <textarea rows={3} className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:border-red-600 outline-none transition-all" 
              value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Describe the customer's needs..." />
          </div>

          <button disabled={loading} type="submit" className="md:col-span-2 w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-red-600/20 mt-4">
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20}/> Save & Qualify Lead</>}
          </button>
        </form>
      </div>
    </div>
  );
}
