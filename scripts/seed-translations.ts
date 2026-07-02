import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const staticPhrases = [
  'Active Bids', 'Compliance Alerts', 'Daily Intelligence', 'Win More Contracts',
  'Contractor Intelligence', 'OSHA Violation Risk', 'Elevator Inspection',
  'Emergency Generator Load Bank Testing', 'Grease Trap Compliance',
  'Backflow Certification Status', 'Fire Sprinkler Inspection Tracker',
  'Tier A Leads Found', 'Expiring State Licenses', 'Municipal Vendor Search Engine',
  'High Intent Demand Alerts', 'Search Radius', 'Select Index Type', 'Enter Zip Code',
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

const manualChineseMap: Record<string, string> = {
  'active bids': '进行中招标',
  'compliance alerts': '合规警报',
  'daily intelligence': '每日情报',
  'win more contracts': '赢得更多合同',
  'contractor intelligence': '承包商情报',
  'osha violation risk': 'OSHA违规风险',
  'elevator inspection': '电梯合规年检',
  'emergency generator load bank testing': '应急发电机负载测试',
  'grease trap compliance': '隔油池合规检查',
  'backflow certification status': '防倒流认证状态',
  'fire sprinkler inspection tracker': '消防喷淋系统检查跟踪',
  'tier a leads found': '发现A级潜在项目',
  'expiring state licenses': '即将过期的州执照',
  'municipal vendor search engine': '市政供应商搜索引擎',
  'high intent demand alerts': '高意向需求警报',
  'search radius': '搜索半径',
  'select index type': '选择指数类型',
  'enter zip code': '输入邮政编码',
};

const manualVietnameseMap: Record<string, string> = {
  'active bids': 'Hồ Sơ Thầu Đang Mở',
  'compliance alerts': 'Cảnh Báo Tuân Thủ',
  'daily intelligence': 'Thông Tin Tình Báo Hàng Ngày',
  'win more contracts': 'Trúng Nhiều Hợp Đồng Hơn',
  'contractor intelligence': 'Thông Tin Nhà Thầu',
  'osha violation risk': 'Nguy Cơ Vi Phạm OSHA',
  'elevator inspection': 'Kiểm Định Thang Máy',
  'emergency generator load bank testing': 'Kiểm Tra Tải Giả Máy Phát Điện Dự Phòng',
  'grease trap compliance': 'Tuân Thủ Bẫy Mỡ',
  'backflow certification status': 'Trạng Thái Chứng Nhận Chống Chảy Ngược',
  'fire sprinkler inspection tracker': 'Theo Dõi Kiểm Tra Vòi Phun Chữa Cháy',
  'tier a leads found': 'Tìm Thấy Khách Hàng Tiềm Năng Nhóm A',
  'expiring state licenses': 'Giấy Phép Bang Sắp Hết Hạn',
  'municipal vendor search engine': 'Công Cụ Tìm Kiếm Nhà Thầu Thành Phố',
  'high intent demand alerts': 'Cảnh Báo Nhu Cầu Cao',
  'search radius': 'Bán Kính Tìm Kiếm',
  'select index type': 'Chọn Loại Chỉ Mục',
  'enter zip code': 'Nhập Mã Bưu Chính',
};

function getRedisHashKey(text: string, lang: string): string {
  const hash = crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
  return `translation:${lang}:${hash}`;
}

async function seed() {
  console.log('Warming Upstash Translation Cache Layer for HardHatRequired...');
  let recordsSeeded = 0;

  for (const phrase of staticPhrases) {
    const lowerPhrase = phrase.toLowerCase();

    const esKey = getRedisHashKey(phrase, 'es');
    const esTranslation = manualSpanishMap[lowerPhrase];
    if (esTranslation) {
      await redis.set(esKey, esTranslation, { ex: 60 * 60 * 24 * 90 });
      recordsSeeded++;
    }

    const zhKey = getRedisHashKey(phrase, 'zh');
    const zhTranslation = manualChineseMap[lowerPhrase];
    if (zhTranslation) {
      await redis.set(zhKey, zhTranslation, { ex: 60 * 60 * 24 * 90 });
      recordsSeeded++;
    }

    const viKey = getRedisHashKey(phrase, 'vi');
    const viTranslation = manualVietnameseMap[lowerPhrase];
    if (viTranslation) {
      await redis.set(viKey, viTranslation, { ex: 60 * 60 * 24 * 90 });
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
