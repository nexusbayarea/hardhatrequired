import { ExtractionPayload, CanonicalEntity, getServiceSignals, EQUIPMENT_ONTOLOGY } from './ontology';

// ── Layer 3: LLM fallback when deterministic extraction is weak ─────────────

interface LlmExtractionResponse {
  services: string[];
  equipment: string[];
  wasteTypes: string[];
}

/**
 * Falls back to LLM when deterministic extraction found fewer than 2 signals
 * or confidence is below 70. Uses the scraped text to infer services,
 * equipment, and waste types via an LLM call.
 */
export async function runLlmExtractionFallback(
  cleanText: string,
  vertical: string,
  currentPayload: ExtractionPayload,
): Promise<ExtractionPayload> {
  // Only trigger if deterministic was weak
  const totalHits = currentPayload.services.length + currentPayload.equipment.length;
  if (totalHits >= 2 && currentPayload.confidence >= 70) {
    return currentPayload;
  }

  // Build a prompt with vertical-specific ontology to constrain the LLM
  const serviceKeys = Object.keys(getServiceSignals(vertical));
  const equipmentKeys = Object.keys(EQUIPMENT_ONTOLOGY);

  const prompt = `You are an industrial service extraction engine. Analyze the text below and extract structured data.

Vertical: ${vertical}

Extract ONLY services and equipment explicitly mentioned in the text.
Choose from these canonical IDs where possible:

Services: ${serviceKeys.join(', ')}
Equipment: ${equipmentKeys.join(', ')}

Return a JSON object with these fields:
- services: string[] — canonical service IDs found in text
- equipment: string[] — canonical equipment IDs found in text  
- wasteTypes: string[] — waste/material types handled (e.g. "hazardous", "medical", "slurry", "contaminated_soil", "industrial_wastewater")

Rules:
1. Only include items EXPLICITLY stated in the text
2. Use the exact canonical IDs listed above when possible
3. If none found, return empty arrays
4. Return ONLY valid JSON

TEXT:
${cleanText.slice(0, 3000)}`;

  try {
    const response = await callLlm(prompt);
    const parsed: LlmExtractionResponse = JSON.parse(response);

    // Normalize LLM output through ontology to get confidence
    const services: CanonicalEntity[] = [];
    const equipment: CanonicalEntity[] = [];

    for (const s of parsed.services || []) {
      if (serviceKeys.includes(s)) {
        services.push({ id: s, confidence: 60 }); // LLM-inferred = lower confidence
      } else {
        services.push({ id: s, confidence: 50 }); // Not in ontology = lowest
      }
    }

    for (const e of parsed.equipment || []) {
      if (equipmentKeys.includes(e)) {
        equipment.push({ id: e, confidence: 60 });
      } else {
        equipment.push({ id: e, confidence: 50 });
      }
    }

    // Merge with existing deterministic results (dedup by id)
    const existingIds = new Set([
      ...currentPayload.services.map(s => s.id),
      ...currentPayload.equipment.map(e => e.id),
    ]);

    const mergedServices = [...currentPayload.services];
    const mergedEquipment = [...currentPayload.equipment];

    for (const s of services) {
      if (!existingIds.has(s.id)) {
        mergedServices.push(s);
        existingIds.add(s.id);
      }
    }

    for (const e of equipment) {
      if (!existingIds.has(e.id)) {
        mergedEquipment.push(e);
        existingIds.add(e.id);
      }
    }

    const mergedConfidence = Math.min(
      100,
      currentPayload.confidence + parsed.services.length * 5 + parsed.equipment.length * 5,
    );

    return {
      services: mergedServices,
      equipment: mergedEquipment,
      wasteTypes: [...new Set([...currentPayload.wasteTypes, ...(parsed.wasteTypes || [])])],
      fitType: currentPayload.fitType,
      confidence: mergedConfidence,
    };
  } catch {
    // LLM failure — return deterministic results unchanged
    return currentPayload;
  }
}

// ── LLM adapter (replace with actual API call) ──────────────────────────────

async function callLlm(prompt: string): Promise<string> {
  // Uses /api/llm/extract internal route or direct API call
  const res = await fetch(process.env.LLM_EXTRACT_API || 'http://localhost:3000/api/llm/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      prompt,
      responseFormat: 'json',
      temperature: 0.1,
      maxTokens: 500,
    }),
  });

  if (!res.ok) throw new Error(`LLM returned ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || data.content || data.text || '';
}
