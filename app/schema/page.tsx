"use client";

import React from 'react';
import VerticalSchemaBuilder, { VerticalRegistry } from '@/components/VerticalSchemaBuilder';

const DEFAULT_VERTICAL: VerticalRegistry = {
  id: 'vert-1',
  name: 'Edge Compute Infrastructure',
  slug: 'edge-compute',
  routing_strategy: 'hybrid_deepseek',
  fields: [
    { key: 'pricing_tier', type: 'string', required: true, description: 'Monthly subscription cost structure' },
    { key: 'compute_capacity', type: 'number', required: true, description: 'Total compute units available per region' },
    { key: 'has_gpu_acceleration', type: 'boolean', required: false, description: 'Flag indicating GPU support across infrastructure' },
    { key: 'supported_regions', type: 'array', required: true, description: 'List of deployment region codes for service availability' },
    { key: 'bandwidth_limits', type: 'object', required: false, description: 'Complex mapping of transfer tier throughput constraints across plan types' },
  ],
};

export default function SchemaPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-cyan-600 text-slate-950 p-1.5 rounded font-black tracking-tighter text-sm flex items-center justify-center">
            ES
          </div>
          <span className="text-xs uppercase font-mono tracking-widest text-cyan-500 font-bold">Extraction Schema Builder</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">Vertical Registry Configuration</h1>
        <p className="text-sm text-slate-400 mt-1">
          Define extraction schemas and routing strategies per vertical. Changes persist to the <code className="text-cyan-400 bg-slate-900 px-1 rounded">vertical_registries</code> table.
        </p>
      </div>
      <VerticalSchemaBuilder initialVertical={DEFAULT_VERTICAL} />
    </div>
  );
}
