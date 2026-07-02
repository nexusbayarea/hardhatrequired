'use client';

import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'es' | 'zh' | 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const esDictionary: Record<string, string> = {
  'hard hat required': 'Hard Hat Required',
  'english': 'English',
  'español': 'Español',
  '中文': '中文',
  'tiếng việt': 'Tiếng Việt',
  'overview': 'Resumen',
  'search': 'Búsqueda',
  'markets': 'Mercados',
  'campaigns': 'Campañas',
  'outreach': 'Divulgación',
  'reports': 'Informes',
  'billing': 'Facturación',
  'settings': 'Configuración',
  'admin': 'Admin',
  'main': 'PRINCIPAL',
  'sales': 'VENTAS',
  'admin section': 'ADMIN',
  'growth plan': 'Plan de Crecimiento',
  'credits': 'Créditos',
  'dashboard': 'Panel de Control',
  'construction market intelligence': 'Inteligencia de Mercado para la Construcción',
  'market search': 'Búsqueda de Mercado',
  'define your target market parameters': 'Defina los parámetros de su mercado objetivo',
  'index': 'Índice',
  '(select)': '(Seleccionar)',
  'radius': 'Radio',
  'zip code': 'Código Postal',
  'enter zip code': 'Ingrese el Código Postal',
  'scanning your market...': 'Escaneando su mercado...',
  'set parameters above and run discovery': 'Establezca parámetros arriba y ejecute la búsqueda',
  'grading:': 'Calificación:',
  ' = good to go': ' = Listo',
  ' = check website or call to verify': ' = Verifique sitio web o llame',
  ' = call to verify': ' = Llame para verificar',
  'run discovery': 'Ejecutar Búsqueda',
  'enter a zip code to begin search.': 'Ingrese un código postal para comenzar la búsqueda.',
  'select an index to search.': 'Seleccione un Índice para buscar.',
  'searching...': 'Buscando...',
  'results': 'Resultados',
  'companies found': 'empresas encontradas',
  'run a search above': 'Ejecute una búsqueda arriba',
  'no results yet': 'Aún no hay resultados',
  'set your parameters above and run a discovery search': 'Establezca sus parámetros arriba y ejecute una búsqueda',
  'discovering companies...': 'Descubriendo empresas...',
  'searching, enriching contacts, detecting signals': 'Buscando, enriqueciendo contactos, detectando señales',
  'company': 'Empresa',
  'grade': 'Grado',
  'distance': 'Distancia',
  'score': 'Puntaje',
  'signals': 'Señales',
  'accurate?': '¿Preciso?',
  'contact': 'Contacto',
  'lead score': 'Puntaje de Cliente Potencial',
  'mi': 'millas',
  'call': 'Llamar',
  'details': 'Detalles',
  'accurate': 'Preciso',
  'bad': 'Incorrecto',
  'mi away': 'millas de distancia',
  'companies indexed': 'Empresas Indexadas',
  'campaigns active': 'Campañas Activas',
  'monthly searches': 'Búsquedas Mensuales',
  'pipeline value': 'Valor del Pipeline',
  'priority a': 'prioridad A',
  'calls today': 'llamadas hoy',
  'avg score': 'puntaje promedio',
  'enrichments': 'enriquecimientos',
  'daily intelligence': 'Inteligencia Diaria',
  'active bids': 'Licitaciones Activas',
  'compliance alerts': 'Alertas de Cumplimiento',
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
  'compliance': 'Cumplimiento Normativo',
};

const zhDictionary: Record<string, string> = {
  'english': '英语',
  'español': '西班牙语',
  '中文': '中文',
  'tiếng việt': '越南语',
  'hard hat required': 'Hard Hat Required',
  'overview': '概览',
  'search': '搜索',
  'dashboard': '控制面板',
  'results': '结果',
  'company': '公司',
  'grade': '评级',
  'distance': '距离',
  'score': '分数',
  'contact': '联系人',
  'call': '拨打电话',
  'details': '详情',
  'radius': '搜索半径',
  'zip code': '邮政编码',
  'enter zip code': '输入邮政编码',
  'searching...': '搜索中...',
  'daily intelligence': '每日情报',
  'active bids': '活跃投标',
  'compliance alerts': '合规提醒',
  'win more contracts': '赢得更多合同',
  'contractor intelligence': '承包商情报',
  'osha violation risk': 'OSHA违规风险',
  'elevator inspection': '电梯检查',
  'emergency generator load bank testing': '应急发电机负载测试',
  'grease trap compliance': '隔油池合规',
  'backflow certification status': '回流认证状态',
  'fire sprinkler inspection tracker': '消防喷头检查跟踪器',
  'tier a leads found': '已找到A级潜在客户',
  'expiring state licenses': '即将过期的州许可证',
  'municipal vendor search engine': '市政供应商搜索引擎',
  'high intent demand alerts': '高意向需求提醒',
  'search radius': '搜索半径',
  'select index type': '选择索引类型',
  'compliance': '合规',
  'market search': '市场搜索',
  'companies found': '找到的公司',
};

const viDictionary: Record<string, string> = {
  'english': 'Tiếng Anh',
  'español': 'Tiếng Tây Ban Nha',
  '中文': 'Tiếng Trung',
  'tiếng việt': 'Tiếng Việt',
  'hard hat required': 'Hard Hat Required',
  'overview': 'Tổng quan',
  'search': 'Tìm kiếm',
  'dashboard': 'Bảng điều khiển',
  'results': 'Kết quả',
  'company': 'Công ty',
  'grade': 'Xếp hạng',
  'distance': 'Khoảng cách',
  'score': 'Điểm',
  'contact': 'Liên hệ',
  'call': 'Gọi',
  'details': 'Chi tiết',
  'radius': 'Bán kính',
  'zip code': 'Mã bưu điện',
  'enter zip code': 'Nhập mã bưu điện',
  'searching...': 'Đang tìm kiếm...',
  'daily intelligence': 'Thông tin hàng ngày',
  'active bids': 'Đấu thầu đang hoạt động',
  'compliance alerts': 'Cảnh báo tuân thủ',
  'win more contracts': 'Giành được nhiều hợp đồng hơn',
  'contractor intelligence': 'Thông tin nhà thầu',
  'osha violation risk': 'Rủi ro vi phạm OSHA',
  'elevator inspection': 'Kiểm tra thang máy',
  'emergency generator load bank testing': 'Kiểm tra tải máy phát điện khẩn cấp',
  'grease trap compliance': 'Tuân thủ bẫy mỡ',
  'backflow certification status': 'Tình trạng chứng nhận chống chảy ngược',
  'fire sprinkler inspection tracker': 'Theo dõi kiểm tra vòi phun chữa cháy',
  'tier a leads found': 'Đã tìm thấy khách hàng tiềm năng cấp A',
  'expiring state licenses': 'Giấy phép tiểu bang sắp hết hạn',
  'municipal vendor search engine': 'Công cụ tìm kiếm nhà cung cấp thành phố',
  'high intent demand alerts': 'Cảnh báo nhu cầu cao',
  'search radius': 'Bán kính tìm kiếm',
  'select index type': 'Chọn loại chỉ mục',
  'compliance': 'Tuân thủ',
  'market search': 'Tìm kiếm thị trường',
  'companies found': 'công ty được tìm thấy',
};

const getStaticDict = (lang: Language): Record<string, string> => {
  switch (lang) {
    case 'es': return esDictionary;
    case 'zh': return zhDictionary;
    case 'vi': return viDictionary;
    default: return {};
  }
};

const clientDictionary: Record<string, string> = {};

const coreDashboardPhrases = [
  'Active Bids', 'Compliance Alerts', 'Daily Intelligence', 'Win More Contracts',
  'Contractor Intelligence', 'OSHA Violation Risk', 'Elevator Inspection',
  'Emergency Generator Load Bank Testing', 'Grease Trap Compliance',
  'Backflow Certification Status', 'Fire Sprinkler Inspection Tracker',
  'Tier A Leads Found', 'Expiring State Licenses', 'Municipal Vendor Search Engine',
  'High Intent Demand Alerts', 'Search Radius', 'Select Index Type', 'Enter Zip Code',
];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [, setTick] = useState(0);

  const setLanguage = async (targetLang: Language) => {
    if (targetLang === 'en') {
      setLanguageState('en');
      return;
    }

    setLoading(true);

    const sampleKey = `translation:${targetLang}:${coreDashboardPhrases[0].toLowerCase()}`;

    if (!clientDictionary[sampleKey]) {
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: coreDashboardPhrases, target: targetLang }),
        });

        if (response.ok) {
          const data = await response.json();
          coreDashboardPhrases.forEach((phrase, index) => {
            const cacheKey = `translation:${targetLang}:${phrase.trim().toLowerCase()}`;
            clientDictionary[cacheKey] = data.translatedText[index];
          });
        }
      } catch (err) {
        console.warn('Translation API unavailable, using static dictionaries:', err);
      }
    }

    setLanguageState(targetLang);
    setLoading(false);
    setTick((prev) => prev + 1);
  };

  const t = (text: string): string => {
    if (language === 'en') return text;
    const key = text.trim().toLowerCase();

    const staticDict = getStaticDict(language);
    if (staticDict[key]) return staticDict[key];

    const lookupKey = `translation:${language}:${key}`;
    return clientDictionary[lookupKey] || text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be run inside a LanguageProvider');
  return context;
};
