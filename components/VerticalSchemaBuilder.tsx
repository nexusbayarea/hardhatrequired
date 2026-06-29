"use client";

import React, { useState } from 'react';

interface SchemaField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
}

export interface VerticalRegistry {
  id: string;
  name: string;
  slug: string;
  routing_strategy: 'direct_flash' | 'hybrid_deepseek';
  fields: SchemaField[];
}

export default function VerticalSchemaBuilder({
  initialVertical
}: {
  initialVertical: VerticalRegistry
}) {
  const [vertical, setVertical] = useState<VerticalRegistry>(initialVertical);
  const [isSaving, setIsSaving] = useState(false);

  const addField = () => {
    const newField: SchemaField = { key: '', type: 'string', required: true, description: '' };
    setVertical({ ...vertical, fields: [...vertical.fields, newField] });
  };

  const removeField = (index: number) => {
    const updatedFields = vertical.fields.filter((_, i) => i !== index);
    setVertical({ ...vertical, fields: updatedFields });
  };

  const updateField = (index: number, key: keyof SchemaField, value: any) => {
    const updatedFields = [...vertical.fields];
    updatedFields[index] = { ...updatedFields[index], [key]: value };
    setVertical({ ...vertical, fields: updatedFields });
  };

  const handleSaveSchema = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/verticals/${vertical.id}/schema`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routing_strategy: vertical.routing_strategy,
          extraction_rules: vertical.fields
        }),
      });

      if (!response.ok) throw new Error('Database serialization execution rejected.');
      alert('Vertical schema sync engine successfully initialized.');
    } catch (error) {
      console.error(error);
      alert('Critical: Failed to save tracking structures.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-xl max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{vertical.name} Setup Panel</h2>
          <p className="text-xs text-slate-400 mt-1">Configuring runtime mutations for slug: <span className="font-mono text-cyan-400">{vertical.slug}</span></p>
        </div>
        <button
          onClick={handleSaveSchema}
          disabled={isSaving}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 transition-colors text-sm font-semibold rounded-md shadow-md text-white"
        >
          {isSaving ? 'Processing Rules...' : 'Save Schema Changes'}
        </button>
      </div>

      <div className="mb-8 p-4 bg-slate-950 rounded-lg border border-slate-800">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Layer 1/2 Orchestration Configuration</h3>
        <label className="block text-xs font-semibold text-slate-300 mb-2">Automated Browser Route Mode</label>
        <select
          value={vertical.routing_strategy}
          onChange={(e) => setVertical({ ...vertical, routing_strategy: e.target.value as any })}
          className="w-full sm:w-72 p-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="direct_flash">Direct Extractor (Gemini 2.5 Flash Only)</option>
          <option value="hybrid_deepseek">Hybrid Orchestration Planner (DeepSeek V3 + Playwright + Gemini)</option>
        </select>
        <p className="text-xs text-slate-500 mt-2">
          {vertical.routing_strategy === 'hybrid_deepseek'
            ? "Best for sites behind dynamic interaction flows, selector menus, or authenticated walls."
            : "Highly cost-efficient fallback path optimized for parsing unstructured markdown logs or literal graphical layouts."}
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Target Extraction Schema</h3>
          <button
            onClick={addField}
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded border border-slate-700 transition-all font-mono"
          >
            + Add Structural Key Field
          </button>
        </div>

        <div className="space-y-3">
          {vertical.fields.map((field, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg items-start sm:items-center">
              <div className="w-full sm:flex-1">
                <input
                  type="text"
                  placeholder="Field Key (e.g., pricing_tier)"
                  value={field.key}
                  onChange={(e) => updateField(idx, 'key', e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-sm font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="w-full sm:w-36">
                <select
                  value={field.type}
                  onChange={(e) => updateField(idx, 'type', e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="array">Array</option>
                  <option value="object">Object</option>
                </select>
              </div>

              <div className="w-full sm:flex-[2]">
                <input
                  type="text"
                  placeholder="Extraction instructions for LLM..."
                  value={field.description}
                  onChange={(e) => updateField(idx, 'description', e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(idx, 'required', e.target.checked)}
                    className="accent-cyan-500 rounded border-slate-700 bg-slate-900"
                  />
                  Required
                </label>

                <button
                  onClick={() => removeField(idx)}
                  className="text-xs p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded transition-all"
                  title="Remove Field"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {vertical.fields.length === 0 && (
            <div className="text-center py-8 bg-slate-950 rounded-lg border border-dashed border-slate-800 text-slate-500 text-sm">
              No schema attributes configured. Click &quot;+ Add Structural Key Field&quot; to build your extractor interface rules.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
