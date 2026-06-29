'use client';

import React, { useState } from 'react';
import { Copy, Check, Phone, MessageSquare, Clock, ShieldCheck, Plus, X, Building2 } from 'lucide-react';

interface Template {
    id: string;
    category: string;
    icon: React.ReactNode;
    title: string;
    text: string;
}

const DISPOSAL_TEMPLATES: Template[] = [
    {
        id: 'initial-inquiry',
        category: 'Discovery',
        icon: <Search size={16} />,
        title: 'Initial Facility Inquiry',
        text: "Hi, I'm calling from Disposal Intelligence Platform. We're verifying facilities in [City] that accept [Material Type]. Do you currently have capacity for new [Material Type] loads?"
    },
    {
        id: 'capacity-verification',
        category: 'Verification',
        icon: <Building2 size={16} />,
        title: 'Capacity Verification',
        text: "Hello, we noticed your facility handles [Material Type]. Can you confirm your maximum daily capacity for slurry disposal? We have a project starting nearby and want to ensure you can handle the volume."
    },
    {
        id: 'night-receiving',
        category: 'Operations',
        icon: <Clock size={16} />,
        title: 'Night Receiving Inquiry',
        text: "Quick question regarding your operating hours: Do you offer night receiving or early morning drop-offs (before 6 AM) for concrete slurry? Our trucks typically finish jobs late."
    },
    {
        id: 'pricing-request',
        category: 'Pricing',
        icon: <DollarSign size={16} />,
        title: 'Pricing Request',
        text: "Can you provide your current 'Price per Load' for [Material Type]? Are there any additional environmental fees or volume discounts available for long-term projects?"
    },
    {
        id: 'follow-up',
        category: 'Follow-up',
        icon: <Phone size={16} />,
        title: 'Follow-Up Call',
        text: "Hi [Name], just following up on our conversation about your facility's slurry disposal services. Have you had a chance to review the approval requirements we discussed?"
    },
    {
        id: 'approval-confirmation',
        category: 'Closing',
        icon: <ShieldCheck size={16} />,
        title: 'Approval Confirmation',
        text: "Great news! Your facility has been marked as 'Verified' on our platform. We'll be recommending your location for upcoming [Material Type] disposal needs in the [City] area."
    }
];

import { Search, DollarSign } from 'lucide-react';

export default function OutreachTemplateLibrary() {
    const [templates, setTemplates] = useState<Template[]>(DISPOSAL_TEMPLATES);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ title: '', text: '', category: 'Discovery' });

    const categories = ['All', 'Discovery', 'Verification', 'Operations', 'Pricing', 'Follow-up', 'Closing'];

    const copyToClipboard = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredTemplates = activeCategory === 'All'
        ? templates
        : templates.filter(t => t.category === activeCategory);

    const addTemplate = () => {
        if (newTemplate.title && newTemplate.text) {
            const template: Template = {
                id: Date.now().toString(),
                ...newTemplate,
                icon: <MessageSquare size={16} />
            };
            setTemplates([...templates, template]);
            setShowAddForm(false);
            setNewTemplate({ title: '', text: '', category: 'Discovery' });
        }
    };

    return (
        <div className="bg-white dark:bg-[#0d0d0d] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Call Sheets</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Verification & Outreach Templates</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${activeCategory === cat
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'border-gray-100 dark:border-gray-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {showAddForm && (
                <div className="mb-6 p-6 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-sm">Create New Script</h3>
                        <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X size={20} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input placeholder="Script Title" className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm" value={newTemplate.title} onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })} />
                        <select className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm" value={newTemplate.category} onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}>
                            {categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                        </select>
                        <button onClick={addTemplate} className="bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all">Save Template</button>
                    </div>
                    <textarea
                        placeholder="Template text... Use [City], [Material Type], [Name] as placeholders"
                        className="mt-4 w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm h-24"
                        value={newTemplate.text}
                        onChange={e => setNewTemplate({ ...newTemplate, text: e.target.value })}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                    <div key={template.id} className="group relative bg-gray-50/50 dark:bg-black/40 p-6 rounded-[2rem] border border-transparent hover:border-red-600 transition-all flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-lg bg-white dark:bg-[#111] text-red-600 shadow-sm border border-gray-50 dark:border-gray-800">
                                    {template.icon}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{template.category}</span>
                            </div>
                            <h3 className="font-bold text-base mb-3 leading-tight">{template.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-4 italic bg-white dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">"{template.text}"</p>
                        </div>

                        <button
                            onClick={() => copyToClipboard(template.id, template.text)}
                            className={`mt-6 w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${copiedId === template.id
                                    ? 'bg-green-500 text-white'
                                    : 'bg-black text-white dark:bg-white dark:text-black hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white shadow-lg shadow-black/5'
                                }`}
                        >
                            {copiedId === template.id ? <Check size={14} /> : <Copy size={14} />}
                            {copiedId === template.id ? 'Copied' : 'Copy Script'}
                        </button>
                    </div>
                ))}

                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-red-600 transition-all min-h-[200px]"
                >
                    <Plus size={24} className="text-gray-400 mb-2" />
                    <span className="text-xs font-bold text-gray-400 uppercase">New Script</span>
                </button>
            </div>
        </div>
    );
}
