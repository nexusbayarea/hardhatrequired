'use client';

import React, { useState, useEffect } from 'react';
import { GripVertical, User, Phone, MapPin, DollarSign } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  city: string;
  serviceType: string;
  budget: string;
  timeline: string;
  ai_score: number;
  status: string;
  created_at: string;
}

const COLUMNS = [
  { id: 'new', label: 'New', color: 'bg-blue-500' },
  { id: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { id: 'qualified', label: 'Qualified', color: 'bg-green-500' },
  { id: 'sent', label: 'Sent to Provider', color: 'bg-purple-500' },
  { id: 'won', label: 'Won', color: 'bg-emerald-500' },
  { id: 'lost', label: 'Lost', color: 'bg-gray-500' },
];

const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'John Smith', phone: '555-0101', city: 'Austin', serviceType: 'Roofing', budget: 'High', timeline: 'ASAP', ai_score: 85, status: 'new', created_at: new Date().toISOString() },
  { id: '2', name: 'Sarah Johnson', phone: '555-0102', city: 'Houston', serviceType: 'HVAC', budget: 'Medium', timeline: 'This Week', ai_score: 72, status: 'contacted', created_at: new Date().toISOString() },
  { id: '3', name: 'Mike Davis', phone: '555-0103', city: 'Dallas', serviceType: 'Plumbing', budget: 'High', timeline: 'ASAP', ai_score: 91, status: 'qualified', created_at: new Date().toISOString() },
  { id: '4', name: 'Emily Brown', phone: '555-0104', city: 'San Antonio', serviceType: 'Electrical', budget: 'Low', timeline: 'Later', ai_score: 45, status: 'new', created_at: new Date().toISOString() },
];

export default function KanbanBoard() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const getLeadsByStatus = (status: string) => leads.filter(l => l.status === status);

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDrop = (status: string) => {
    if (draggedLead) {
      setLeads(leads.map(l => l.id === draggedLead.id ? { ...l, status } : l));
      setDraggedLead(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 dark:bg-green-900/30';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30';
    return 'text-red-600 bg-red-50 dark:bg-red-900/30';
  };

  return (
    <div className="bg-white dark:bg-[#0d0d0d] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Lead Pipeline</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Drag to update status</p>
        </div>
        <div className="text-sm font-bold text-gray-500">
          {leads.length} Total Leads
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(column => (
          <div
            key={column.id}
            className="min-w-[180px]"
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(column.id)}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">{column.label}</span>
              <span className="text-xs font-bold text-gray-300 ml-auto">{getLeadsByStatus(column.id).length}</span>
            </div>

            <div className="space-y-3">
              {getLeadsByStatus(column.id).map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => handleDragStart(lead)}
                  className="bg-gray-50 dark:bg-black/40 rounded-xl p-4 border border-gray-100 dark:border-gray-800 cursor-grab hover:border-red-600 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      <span className="font-bold text-sm">{lead.name}</span>
                    </div>
                    <GripVertical size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Phone size={10} /> {lead.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={10} /> {lead.city}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] font-black uppercase text-gray-400">{lead.serviceType}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${getScoreColor(lead.ai_score)}`}>
                      {lead.ai_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
