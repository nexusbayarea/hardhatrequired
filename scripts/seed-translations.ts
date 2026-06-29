import crypto from 'crypto';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const staticPhrases = [
  'Active Bids',
  'Compliance Alerts',
  'Daily Intelligence',
  'Win More Contracts',
  'Contractor Intelligence',
  'OSHA Violation Risk',
  'Elevator Inspection',
  'Emergency Generator Load Bank Testing',
  'Grease Trap Compliance',
  'Backflow Certification Status',
  'Fire Sprinkler Inspection Tracker',
  'Tier A Leads Found',
  'Expiring State Licenses',
  'Municipal Vendor Search Engine',
  'High Intent Demand Alerts',
  'Search Radius',
  'Select Index Type',
  'Enter Zip Code',
];

const manualSpanishMap: Record<string, string> = {
  'active bids': 'Licitaciones Activas',
  'compliance alerts': 'Alertas de Cumplimiento Normativo',
  'daily intelligence': 'Inteligencia Diaria',
  'win more contracts': 'Gane Más Contratos',
  'contractor intelligence': 'Inteligencia de Contratistas',
  'osha violation risk': 'Riesgo de Infracción de OSHA',
  'elevator inspection': 'Inspección de Elevadores',
  'emergency generator load bank testing': 'Prueba de Banco de Carga de Generadores de Emergencia',
  'grease trap compliance': 'Cumplimiento de Trampas de Grasa',
  'backflow certification status': 'Estado de Certificación de Flujo Inverso',
  'fire sprinkler inspection tracker': 'Rastreador de Inspección de Rociadores de Incendios',
  'tier a leads found': 'Clientes Potenciales de Nivel A Encontrados',
  'expiring state licenses': 'Licencias Estatales por Expirar',
  'municipal vendor search engine': 'Motor de Búsqueda de Proveedores Municipales',
  'high intent demand alerts': 'Alertas de Demanda de Alta Intención',
  'search radius': 'Radio de Búsqueda',
  'select index type': 'Seleccionar Tipo de Índice',
  'enter zip code': 'Ingrese el Código Postal',
};

function getRedisHashKey(text: string, lang: string): string {
  const hash = crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
  return `translation:${lang}:${hash}`;
}

async function seed() {
  console.log('Warming Upstash Translation Cache Layer for HardHatRequired...');
  let recordsSeeded = 0;

  for (const phrase of staticPhrases) {
    const key = getRedisHashKey(phrase, 'es');
    const translation = manualSpanishMap[phrase.toLowerCase()];

    if (translation) {
      await redis.set(key, translation, { ex: 60 * 60 * 24 * 90 });
      recordsSeeded++;
    }
  }

  console.log(`Successfully seeded ${recordsSeeded} primary phrases to Upstash.`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding process encountered an error:', err);
  process.exit(1);
});
