'use client';

import React, { useState } from 'react';
import { Copy, Check, Zap, Clock, ShieldCheck, Plus, X } from 'lucide-react';

interface Template {
  id: string;
  category: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'first-reply',
    category: 'Initial',
    icon: <Zap size={16} />,
    title: 'First Reply (Instant)',
    text: "Hi! Thanks for reaching out. I've received your request for [Service] in [City]. Are you looking to get this started ASAP or just getting some quotes for later this week?"
  },
  {
    id: 'qualify',
    category: 'Qualification',
    icon: <ShieldCheck size={16} />,
    title: 'Qualification Script',
    text: "To give you an accurate estimate, could you tell me a bit more about the project scope? Also, what is your rough budget range (Low, Medium, or High) so I can match you with the right pro?"
  },
  {
    id: 'follow-up',
    category: 'Follow-up',
    icon: <Clock size={16} />,
    title: 'Follow-up (24hr)',
    text: "Hey, just checking back in on your [Service] request. We have a provider available in [City] tomorrow morning. Would you like me to lock in a time for a quick call?"
  },
  {
    id: 'closing',
    category: 'Closing',
    icon: <Zap size={16} />,
    title: 'Closing Script',
    text: "Great news! I've found a perfect match for your [Service] project. The provider is licensed, insured, and has excellent reviews. They can start [Timeline]. Ready to connect you?"
  }
];

export default function TemplateLibrary() {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ title: '', text: '', category: 'Initial' });

  const categories = ['All', 'Initial', 'Qualification', 'Follow-up', 'Closing'];

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
        icon: <Zap size={16} />
      };
      setTemplates([...templates, template]);
      setShowAddForm(false);
      setNewTemplate({ title: '', text: '', category: 'Initial' });
    }
  };

  return (
    <div className="bg-white dark:bg-[#0d0d0d] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Script Library</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">High-Conversion Templates</p>
        </div>
        <div className="flex gap-2">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${
                activeCategory === cat 
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
            <h3 className="font-bold">Add New Template</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Template Title" className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm" value={newTemplate.title} onChange={e => setNewTemplate({...newTemplate, title: e.target.value})} />
            <select className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm" value={newTemplate.category} onChange={e => setNewTemplate({...newTemplate, category: e.target.value})}>
              {categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={addTemplate} className="bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all">Save Template</button>
          </div>
          <textarea 
            placeholder="Template text... Use [Service], [City], [Timeline] as placeholders" 
            className="mt-4 w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm h-24" 
            value={newTemplate.text} 
            onChange={e => setNewTemplate({...newTemplate, text: e.target.value})} 
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="group relative bg-gray-50/50 dark:bg-black/40 p-6 rounded-[2rem] border border-transparent hover:border-red-600 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-white dark:bg-[#111] text-red-600 shadow-sm">
                  {template.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{template.category}</span>
              </div>
              <h3 className="font-bold text-lg mb-3 leading-tight">{template.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-4 italic">"{template.text}"</p>
            </div>

            <button 
              onClick={() => copyToClipboard(template.id, template.text)}
              className={`mt-6 w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                copiedId === template.id 
                ? 'bg-green-500 text-white' 
                : 'bg-black text-white dark:bg-white dark:text-black hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white'
              }`}
            >
              {copiedId === template.id ? <Check size={14}/> : <Copy size={14}/>}
              {copiedId === template.id ? 'Copied' : 'Copy Script'}
            </button>
          </div>
        ))}

        <button 
          onClick={() => setShowAddForm(true)}
          className="flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-red-600 transition-all min-h-[250px]"
        >
          <Plus size={24} className="text-gray-400 mb-2" />
          <span className="text-xs font-bold text-gray-400 uppercase">Add Template</span>
        </button>
      </div>
    </div>
  );
}
