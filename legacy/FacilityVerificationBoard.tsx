'use client';

import React, { useState } from 'react';
import { GripVertical, Building2, Phone, MapPin, ShieldCheck, AlertCircle } from 'lucide-react';
import { Facility, MOCK_FACILITIES } from '@/lib/types';

interface BoardFacility extends Facility {
    verificationStatus: string;
}

const COLUMNS = [
    { id: 'discovered', label: 'Discovered', color: 'bg-blue-500' },
    { id: 'need_contact', label: 'Need Contact', color: 'bg-yellow-500' },
    { id: 'called', label: 'Called', color: 'bg-orange-500' },
    { id: 'verified', label: 'Verified', color: 'bg-purple-500' },
    { id: 'approved', label: 'Approved', color: 'bg-emerald-500' },
    { id: 'rejected', label: 'Rejected', color: 'bg-gray-500' },
];

export default function FacilityVerificationBoard() {
    const [facilities, setFacilities] = useState<BoardFacility[]>(
        MOCK_FACILITIES.map((f, i) => ({
            ...f,
            verificationStatus: i === 0 ? 'approved' : i === 1 ? 'verified' : i === 2 ? 'discovered' : i === 3 ? 'called' : i === 4 ? 'approved' : 'need_contact'
        }))
    );
    const [draggedFacility, setDraggedFacility] = useState<BoardFacility | null>(null);

    const getFacilitiesByStatus = (status: string) => facilities.filter(f => f.verificationStatus === status);

    const handleDragStart = (facility: BoardFacility) => {
        setDraggedFacility(facility);
    };

    const handleDrop = (status: string) => {
        if (draggedFacility) {
            setFacilities(facilities.map(f => f.id === draggedFacility.id ? { ...f, verificationStatus: status } : f));
            setDraggedFacility(null);
        }
    };

    return (
        <div className="bg-white dark:bg-[#0d0d0d] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Verification Board</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage facility verification lifecycle</p>
                </div>
                <div className="text-sm font-bold text-gray-500">
                    {facilities.length} Total Facilities
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
                {COLUMNS.map(column => (
                    <div
                        key={column.id}
                        className="min-w-[200px]"
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => handleDrop(column.id)}
                    >
                        <div className="flex items-center gap-2 mb-4 bg-gray-50 dark:bg-black/20 p-2 rounded-xl border border-gray-100/50 dark:border-gray-800/50">
                            <div className={`w-2 h-2 rounded-full ${column.color}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{column.label}</span>
                            <span className="text-[10px] font-bold text-gray-300 ml-auto">{getFacilitiesByStatus(column.id).length}</span>
                        </div>

                        <div className="space-y-3">
                            {getFacilitiesByStatus(column.id).map(facility => (
                                <div
                                    key={facility.id}
                                    draggable
                                    onDragStart={() => handleDragStart(facility)}
                                    className="bg-white dark:bg-black/60 rounded-xl p-4 border border-gray-100 dark:border-gray-800 cursor-grab active:cursor-grabbing hover:border-red-600/50 transition-all group shadow-sm"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={12} className="text-gray-400" />
                                            <span className="font-bold text-xs truncate max-w-[120px]">{facility.name}</span>
                                        </div>
                                        <GripVertical size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    <div className="space-y-1 text-[10px] text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={10} /> {facility.city}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Phone size={10} /> {facility.phone}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                        <span className="text-[9px] font-black uppercase text-gray-400 truncate max-w-[80px]">{facility.facilityType}</span>
                                        <div className="flex items-center gap-1">
                                            {facility.verified ? (
                                                <ShieldCheck size={14} className="text-green-500" />
                                            ) : (
                                                <AlertCircle size={14} className="text-amber-500" />
                                            )}
                                        </div>
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
