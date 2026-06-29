'use client';

import React, { useState } from 'react';
import { X, Search, Loader2, MapPin, Navigation } from 'lucide-react';

interface FacilitySearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch?: (results: any) => void;
}

export default function FacilitySearchModal({ isOpen, onClose, onSearch }: FacilitySearchModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        city: '',
        state: 'CA',
        materialType: 'Concrete Slurry',
        radius: '25 miles'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate search
        setTimeout(() => {
            setLoading(false);
            onClose();
            // In a real app, this would return results
            alert(`Search completed for ${formData.materialType} in ${formData.city}, ${formData.state} within ${formData.radius}. Matches found!`);
            onSearch?.([]);
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0f0f0f] w-full max-w-xl rounded-[2.5rem] p-8 md:p-10 border border-gray-200 dark:border-gray-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-400 to-red-600" />

                <button onClick={onClose} className="absolute top-8 right-8 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    <X size={20} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white flex items-center justify-center text-white dark:text-black shadow-lg">
                        <Search size={22} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Find Facilities</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Locate verified disposal sites</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Job City</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input required placeholder="e.g. Modesto" className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-sm font-medium"
                                    value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">State</label>
                            <select className="w-full px-4 py-3 bg-gray-50 dark:bg-black border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-sm font-medium appearance-none"
                                value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })}>
                                <option value="CA">California</option>
                                <option value="NV">Nevada</option>
                                <option value="AZ">Arizona</option>
                                <option value="OR">Oregon</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Material Type</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {['Concrete Slurry', 'Asphalt Slurry', 'Mixed Slurry'].map(type => (
                                <button key={type} type="button" onClick={() => setFormData({ ...formData, materialType: type })}
                                    className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all ${formData.materialType === type ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20' : 'bg-white dark:bg-black border-gray-100 dark:border-gray-800 text-gray-500'}`}>
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Search Radius</label>
                        <div className="flex flex-wrap gap-2">
                            {['10 miles', '15 miles', '20 miles', '25 miles', '50 miles'].map(r => (
                                <button key={r} type="button" onClick={() => setFormData({ ...formData, radius: r })}
                                    className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${formData.radius === r ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-300'}`}>
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button disabled={loading} type="submit" className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-xl shadow-red-600/20 mt-4 group">
                        {loading ? <Loader2 className="animate-spin" /> : <><Navigation size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> Start Discovery Search</>}
                    </button>

                    <p className="text-[10px] text-center text-gray-400 font-medium">
                        Searching across 1,420+ indexed disposal facilities
                    </p>
                </form>
            </div>
        </div>
    );
}
