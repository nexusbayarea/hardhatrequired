'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

type Language = 'en' | 'es' | 'zh' | 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  translateText: (text: string, target?: Language) => Promise<string>;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const esDictionary: Record<string, string> = {
  // ─── App-wide ───
  'hard hat required': 'Hard Hat Required',
  'english': 'English',
  'español': 'Español',
  '中文': '中文',
  'tiếng việt': 'Tiếng Việt',

  // ─── Dashboard chrome (sidebar, topbar, bottom nav) ───
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

  // ─── Search console ───
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

  // ─── Results ───
  'results': 'Resultados',
  'companies found': 'empresas encontradas',
  'run a search above': 'Ejecute una búsqueda arriba',
  'no results yet': 'Aún no hay resultados',
  'set your parameters above and run a discovery search': 'Establezca sus parámetros arriba y ejecute una búsqueda',
  'discovering companies...': 'Descubriendo empresas...',
  'searching, enriching contacts, detecting signals': 'Buscando, enriqueciendo contactos, detectando señales',

  // ─── Results table ───
  'company': 'Empresa',
  'grade': 'Grado',
  'distance': 'Distancia',
  'score': 'Puntaje',
  'signals': 'Señales',
  'accurate?': '¿Preciso?',
  'contact': 'Contacto',
  'lead score': 'Puntaje de Cliente Potencial',
  'mi': 'millas',

  // ─── Results cards (mobile) ───
  'call': 'Llamar',
  'details': 'Detalles',
  'accurate': 'Preciso',
  'bad': 'Incorrecto',
  'mi away': 'millas de distancia',

  // ─── Metrics ───
  'companies indexed': 'Empresas Indexadas',
  'campaigns active': 'Campañas Activas',
  'monthly searches': 'Búsquedas Mensuales',
  'pipeline value': 'Valor del Pipeline',
  'priority a': 'prioridad A',
  'calls today': 'llamadas hoy',
  'avg score': 'puntaje promedio',
  'enrichments': 'enriquecimientos',

  // ─── Landing page ───
  'daily intelligence': 'Inteligencia Diaria',
  'active bids': 'Licitaciones Activas',
  'compliance': 'Cumplimiento Normativo',
  'lead generation': 'Generación de Clientes Potenciales',
  'market intelligence': 'Inteligencia de Mercado',
  'industry index': 'Índice de la Industria',
  'win more contracts': 'Gane Más Contratos',
  'contractor intelligence': 'Inteligencia de Contratistas',
  'osha violation risk': 'Riesgo de Infracción de OSHA',
  'search radius': 'Radio de Búsqueda',
  'source': 'Fuente',
  'pipeline': 'Tubería de Ventas',
  'login': 'Iniciar Sesión',
  'get access': 'Obtener Acceso',
  'bids': 'Licitaciones',
  'news': 'Noticias',
  'compliance alerts': 'Alertas de Cumplimiento',
  'elevator inspection': 'Inspección de Elevadores',
  'emergency generator load bank testing': 'Prueba de Banco de Carga de Generadores de Emergencia',
  'grease trap compliance': 'Cumplimiento de Trampas de Grasa',
  'backflow certification status': 'Estado de Certificación de Flujo Inverso',
  'fire sprinkler inspection tracker': 'Rastreador de Inspección de Rociadores de Incendios',
  'tier a leads found': 'Clientes Potenciales de Nivel A Encontrados',
  'expiring state licenses': 'Licencias Estatales por Expirar',
  'municipal vendor search engine': 'Motor de Búsqueda de Proveedores Municipales',
  'high intent demand alerts': 'Alertas de Demanda de Alta Intención',
  'find every job': 'Encuentre Cada Trabajo',
  'win every bid': 'Gane Cada Licitación',
  'ai-powered market intelligence built for the field.': 'Inteligencia de mercado impulsada por IA, construida para el campo.',
  'search by zip. score companies. close more contracts —': 'Busque por código postal. Califique empresas. Cierre más contratos —',
  'whether you\'re on a job site at noon or running a night crew.': 'ya sea que esté en un sitio de trabajo al mediodía o dirigiendo un equipo nocturno.',
  'built for construction': 'Construido para la Construcción',
  'geo-targeted search': 'Búsqueda Geo-Dirigida',
  'ai bid proposals': 'Propuestas de Licitación con IA',
  'live lead scoring': 'Puntuación de Clientes Potenciales en Vivo',
  'open dashboard': 'Abrir Panel de Control',
  'book a demo': 'Solicitar una Demostración',
  'scroll': 'Desplazar',
  'how it works': 'Cómo Funciona',
  'three steps.': 'Tres Pasos.',
  'zero guesswork.': 'Cero Conjeturas.',
  'search your market': 'Busque Su Mercado',
  'score every lead': 'Califique Cada Cliente Potencial',
  'close the job': 'Cierre el Trabajo',
  'core engines': 'Motores Principales',
  'four engines.': 'Cuatro Motores.',
  'one platform.': 'Una Plataforma.',
  'industry verticals': 'Verticales de la Industria',
  'built for your industry.': 'Construido para Su Industria.',
  'live': 'En Vivo',
  'beta': 'Beta',
  'get started today': 'Comience Hoy',
  'your market.': 'Su Mercado.',
  'mapped in minutes.': 'Mapeado en Minutos.',

  // ─── Vertical names for search dropdown ───
  'asbestos_abatement': 'Asbesto y Eliminación de Plomo',
  'backflow_testing': 'Prueba de Prevención de Flujo Inverso',
  'grease_trap': 'Bombeo de Trampas de Grasa Comerciales',
  'kitchen_exhaust': 'Desengrase de Campanas de Cocina Comerciales',
  'concrete': 'Servicios de Concreto',
  'elevator_inspection': 'Inspección y Certificación de Elevadores',
  'generator_testing': 'Prueba de Banco de Carga de Generadores de Emergencia',
  'fire_extinguisher': 'Inspección y Recarga de Extintores',
  'fire_sprinkler': 'Prueba de Presión de Rociadores Contra Incendios',
  'marine_construction': 'Infraestructura Marina y Muelles Pesados',
  'hvac_balance': 'Prueba y Balanceo de HVAC',
  'hydro_excavation': 'Hidroexcavación y Excavación No Destructiva',
  'commercial_roofing': 'Techado Plano Industrial y Comercial',
  'scrap_metal': 'Procesamiento de Chatarra Industrial',
  'industrial_wastewater': 'Tratamiento de Aguas Residuales Industriales',
  'medical_waste': 'Eliminación de Residuos Médicos',
  'slurry_concrete': 'Slurry / Lechada',
  'stormwater_compliance': 'Cumplimiento de SWPPP / Aguas Pluviales',
  'tank_testing': 'Prueba de Tanques Subterráneos',

  // ─── Step bodies (landing) ───
  'enter a zip code. pick a vertical. we scan every company within your radius — contractors, subs, suppliers.':
    'Ingrese un código postal. Elija una vertical. Escaneamos cada empresa en su radio — contratistas, subcontratistas, proveedores.',
  'our ai ranks companies by revenue signals, fleet size, and buying intent. you see who\'s ready to spend.':
    'Nuestra IA clasifica empresas por señales de ingresos, tamaño de flota e intención de compra. Usted ve quién está listo para gastar.',
  'one-tap calling, auto-enriched contacts, and ai-drafted bid proposals. done before the next pour.':
    'Llamadas con un solo toque, contactos enriquecidos automáticamente y propuestas de licitación redactadas por IA. Listo antes del próximo vertido.',

  // ─── Engine titles (landing) ───
  'discovery engine': 'Motor de Descubrimiento',
  'enrichment engine': 'Motor de Enriquecimiento',
  'scoring engine': 'Motor de Calificación',
  'campaign engine': 'Motor de Campañas',

  // ─── Engine descriptions (landing) ───
  'search 8+ verticals with geo-intelligence and industry signals. find companies your competitors don\'t know exist.':
    'Busque en más de 8 verticales con geointeligencia y señales de la industria. Encuentre empresas que sus competidores ni saben que existen.',
  'auto-populate verified contacts, phones, emails, and decision-maker data for every company found.':
    'Complete automáticamente contactos verificados, teléfonos, correos electrónicos y datos de tomadores de decisiones para cada empresa encontrada.',
  'priority rankings based on revenue, fleet, permit activity, and buying signals. know who to call first.':
    'Clasificaciones prioritarias basadas en ingresos, flota, actividad de permisos y señales de compra. Sepa a quién llamar primero.',
  'deploy targeted outreach and track every touchpoint from first call to signed contract.':
    'Despliegue divulgación dirigida y rastree cada punto de contacto desde la primera llamada hasta el contrato firmado.',
  'every function you need to prospect, enrich, score, and close — unified in a single field-hardened interface built for construction teams.':
    'Cada función que necesita para prospectar, enriquecer, calificar y cerrar — unificada en una sola interfaz robusta construida para equipos de construcción.',

  // ─── CTA body ───
  'book a 20-minute demo. we\'ll map your market live and show you exactly where the revenue is — before your competitors find it.':
    'Agende una demostración de 20 minutos. Mapearemos su mercado en vivo y le mostraremos exactamente dónde están los ingresos — antes de que sus competidores los encuentren.',
};

const zhDictionary: Record<string, string> = {
  'english': '英语',
  'español': '西班牙语',
  '中文': '中文',
  'tiếng việt': '越南语',
  'hard hat required': 'Hard Hat Required',
  'dashboard': '仪表盘',
  'search': '搜索',
  'settings': '设置',
  'login': '登录',
  'radius': '半径',
  'zip code': '邮政编码',
  'results': '结果',
  'company': '公司',
  'grade': '等级',
  'distance': '距离',
  'score': '分数',
  'contact': '联系人',
  'bids': '投标',
  'news': '新闻',
  'compliance': '合规',
  'market search': '市场搜索',
  'run discovery': '执行搜索',
  'open dashboard': '打开仪表盘',
};

const viDictionary: Record<string, string> = {
  'english': 'Tiếng Anh',
  'español': 'Tiếng Tây Ban Nha',
  '中文': 'Tiếng Trung',
  'tiếng việt': 'Tiếng Việt',
  'hard hat required': 'Hard Hat Required',
  'dashboard': 'Bảng điều khiển',
  'search': 'Tìm kiếm',
  'settings': 'Cài đặt',
  'login': 'Đăng nhập',
  'radius': 'Bán kính',
  'zip code': 'Mã ZIP',
  'results': 'Kết quả',
  'company': 'Công ty',
  'grade': 'Điểm',
  'distance': 'Khoảng cách',
  'score': 'Điểm số',
  'contact': 'Liên hệ',
  'bids': 'Đấu thầu',
  'news': 'Tin tức',
  'compliance': 'Tuân thủ',
  'market search': 'Tìm kiếm thị trường',
  'run discovery': 'Chạy khám phá',
  'open dashboard': 'Mở bảng điều khiển',
};

function interpolate(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [runtimeCache, setRuntimeCache] = useState<Record<string, string>>({});
  const missedKeys = useRef<Set<string>>(new Set());

  const setLanguage = async (targetLang: Language) => {
    if (targetLang === 'en') {
      setLanguageState('en');
      return;
    }
    setLoading(true);
    setLanguageState(targetLang);
    setLoading(false);
  };

  const getDictionary = (): Record<string, string> => {
    switch (language) {
      case 'es': return esDictionary;
      case 'zh': return zhDictionary;
      case 'vi': return viDictionary;
      default: return {};
    }
  };

  const t = (text: string, vars?: Record<string, string | number>): string => {
    if (language === 'en') {
      return vars ? interpolate(text, vars) : text;
    }
    const key = text.trim().toLowerCase();
    const dict = getDictionary();
    const dictTranslation = dict[key];
    if (dictTranslation) {
      return vars ? interpolate(dictTranslation, vars) : dictTranslation;
    }
    const cachedTranslation = runtimeCache[key];
    if (cachedTranslation) {
      return vars ? interpolate(cachedTranslation, vars) : cachedTranslation;
    }
    missedKeys.current.add(key);
    return vars ? interpolate(text, vars) : text;
  };

  const translateText = useCallback(async (text: string, target?: Language): Promise<string> => {
    const lang = target || language;
    if (lang === 'en') return text;
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target: lang }),
      });
      const data = await res.json();
      if (data.success && data.translatedText) {
        const key = text.trim().toLowerCase();
        setRuntimeCache(prev => ({ ...prev, [key]: data.translatedText }));
        return data.translatedText;
      }
    } catch {}
    return text;
  }, [language]);

  useEffect(() => {
    if (language !== 'en' && missedKeys.current.size > 0) {
      const keys = Array.from(missedKeys.current);
      missedKeys.current.clear();
      fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: keys, target: language }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.translatedText) {
            const batch: Record<string, string> = {};
            const translations = Array.isArray(data.translatedText) ? data.translatedText : [data.translatedText];
            keys.forEach((key, i) => {
              batch[key] = translations[i] || key;
            });
            setRuntimeCache(prev => ({ ...prev, ...batch }));
          }
        })
        .catch(() => {});
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateText, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
