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

  // ─── Landing page ───
  'lead generation': 'Generación de Clientes Potenciales',
  'market intelligence': 'Inteligencia de Mercado',
  'industry index': 'Índice de la Industria',
  'source': 'Fuente',
  'pipeline': 'Tubería de Ventas',
  'login': 'Iniciar Sesión',
  'get access': 'Obtener Acceso',
  'bids': 'Licitaciones',
  'news': 'Noticias',
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

  // ─── Landing page ───
  'lead generation': '潜在客户生成',
  'market intelligence': '市场情报',
  'industry index': '行业指数',
  'source': '来源',
  'pipeline': '销售管道',
  'login': '登录',
  'get access': '获取访问权限',
  'bids': '投标',
  'news': '新闻',
  'find every job': '找到每个工作',
  'win every bid': '赢得每个投标',
  'ai-powered market intelligence built for the field.': '为现场打造的AI驱动市场情报。',
  'search by zip. score companies. close more contracts —': '按邮编搜索。评估公司。达成更多合同 —',
  'whether you\'re on a job site at noon or running a night crew.': '无论您中午在工地还是带领夜班团队。',
  'built for construction': '为建筑行业打造',
  'geo-targeted search': '地理定位搜索',
  'ai bid proposals': 'AI投标提案',
  'live lead scoring': '实时潜在客户评分',
  'open dashboard': '打开仪表盘',
  'book a demo': '预约演示',
  'scroll': '向下滚动',
  'how it works': '工作原理',
  'three steps.': '三个步骤。',
  'zero guesswork.': '零猜测。',
  'search your market': '搜索您的市场',
  'score every lead': '评估每个潜在客户',
  'close the job': '完成工作',
  'core engines': '核心引擎',
  'four engines.': '四个引擎。',
  'one platform.': '一个平台。',
  'industry verticals': '行业垂直领域',
  'built for your industry.': '为您的行业打造。',
  'live': '实时',
  'beta': '测试版',
  'get started today': '立即开始',
  'your market.': '您的市场。',
  'mapped in minutes.': '几分钟内完成映射。',

  // ─── Vertical names for search dropdown ───
  'asbestos_abatement': '石棉和铅清除',
  'backflow_testing': '回流预防测试',
  'grease_trap': '商用油脂陷阱泵送',
  'kitchen_exhaust': '商用厨房排烟罩清洁',
  'concrete': '混凝土服务',
  'elevator_inspection': '电梯检查和认证',
  'generator_testing': '应急发电机负载测试',
  'fire_extinguisher': '灭火器检查和充装',
  'fire_sprinkler': '消防喷头压力测试',
  'marine_construction': '海洋基础设施和重型码头',
  'hvac_balance': 'HVAC测试和平衡',
  'hydro_excavation': '水力挖掘和非破坏性挖掘',
  'commercial_roofing': '工业和商业平屋顶',
  'scrap_metal': '工业废金属加工',
  'industrial_wastewater': '工业废水处理',
  'medical_waste': '医疗废物处理',
  'slurry_concrete': '泥浆/浆液',
  'stormwater_compliance': 'SWPPP/雨水合规',
  'tank_testing': '地下储罐测试',

  // ─── Step bodies (landing) ───
  'enter a zip code. pick a vertical. we scan every company within your radius — contractors, subs, suppliers.':
    '输入邮政编码。选择垂直领域。我们扫描您半径内的每家公司 — 承包商、分包商、供应商。',
  'our ai ranks companies by revenue signals, fleet size, and buying intent. you see who\'s ready to spend.':
    '我们的AI根据收入信号、车队规模和购买意向对公司进行排名。您可以看到谁准备花钱。',
  'one-tap calling, auto-enriched contacts, and ai-drafted bid proposals. done before the next pour.':
    '一键拨号、自动丰富联系人和AI起草的投标提案。在下一次浇筑前完成。',

  // ─── Engine titles (landing) ───
  'discovery engine': '发现引擎',
  'enrichment engine': '丰富引擎',
  'scoring engine': '评分引擎',
  'campaign engine': '活动引擎',

  // ─── Engine descriptions (landing) ───
  'search 8+ verticals with geo-intelligence and industry signals. find companies your competitors don\'t know exist.':
    '使用地理智能和行业信号搜索8+个垂直领域。找到您的竞争对手不知道存在的公司。',
  'auto-populate verified contacts, phones, emails, and decision-maker data for every company found.':
    '自动填充每家公司已验证的联系人、电话、电子邮件和决策者数据。',
  'priority rankings based on revenue, fleet, permit activity, and buying signals. know who to call first.':
    '基于收入、车队、许可证活动和购买信号的优先级排名。知道应该先给谁打电话。',
  'deploy targeted outreach and track every touchpoint from first call to signed contract.':
    '部署有针对性的外联并跟踪从第一次通话到签署合同的每个接触点。',
  'every function you need to prospect, enrich, score, and close — unified in a single field-hardened interface built for construction teams.':
    '您需要的每个功能 — 勘探、丰富、评分和成交 — 统一在一个为建筑团队打造的坚固界面中。',

  // ─── CTA body ───
  'book a 20-minute demo. we\'ll map your market live and show you exactly where the revenue is — before your competitors find it.':
    '预约20分钟演示。我们将实时映射您的市场，并向您展示收入确切所在 — 在您的竞争对手发现之前。',
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

  // ─── Landing page ───
  'lead generation': 'Tạo khách hàng tiềm năng',
  'market intelligence': 'Thông tin thị trường',
  'industry index': 'Chỉ số ngành',
  'source': 'Nguồn',
  'pipeline': 'Đường ống bán hàng',
  'login': 'Đăng nhập',
  'get access': 'Truy cập',
  'bids': 'Đấu thầu',
  'news': 'Tin tức',
  'find every job': 'Tìm mọi công việc',
  'win every bid': 'Thắng mọi đấu thầu',
  'ai-powered market intelligence built for the field.': 'Thông tin thị trường do AI cung cấp, được xây dựng cho thực địa.',
  'search by zip. score companies. close more contracts —': 'Tìm kiếm theo mã bưu điện. Đánh giá công ty. Chốt nhiều hợp đồng hơn —',
  'whether you\'re on a job site at noon or running a night crew.': 'dù bạn đang ở công trường buổi trưa hay dẫn đội đêm.',
  'built for construction': 'Xây dựng cho ngành xây dựng',
  'geo-targeted search': 'Tìm kiếm theo vị trí địa lý',
  'ai bid proposals': 'Đề xuất đấu thầu AI',
  'live lead scoring': 'Đánh giá khách hàng tiềm năng trực tiếp',
  'open dashboard': 'Mở bảng điều khiển',
  'book a demo': 'Đặt lịch demo',
  'scroll': 'Cuộn',
  'how it works': 'Cách hoạt động',
  'three steps.': 'Ba bước.',
  'zero guesswork.': 'Không phải phỏng đoán.',
  'search your market': 'Tìm kiếm thị trường của bạn',
  'score every lead': 'Đánh giá mọi khách hàng tiềm năng',
  'close the job': 'Chốt công việc',
  'core engines': 'Động cơ cốt lõi',
  'four engines.': 'Bốn động cơ.',
  'one platform.': 'Một nền tảng.',
  'industry verticals': 'Lĩnh vực ngành dọc',
  'built for your industry.': 'Xây dựng cho ngành của bạn.',
  'live': 'Trực tiếp',
  'beta': 'Phiên bản thử nghiệm',
  'get started today': 'Bắt đầu hôm nay',
  'your market.': 'Thị trường của bạn.',
  'mapped in minutes.': 'Được lập bản đồ trong vài phút.',

  // ─── Vertical names for search dropdown ───
  'asbestos_abatement': 'Loại bỏ amiăng và chì',
  'backflow_testing': 'Kiểm tra ngăn dòng chảy ngược',
  'grease_trap': 'Bơm bẫy mỡ thương mại',
  'kitchen_exhaust': 'Vệ sinh máy hút mùi bếp thương mại',
  'concrete': 'Dịch vụ bê tông',
  'elevator_inspection': 'Kiểm tra và chứng nhận thang máy',
  'generator_testing': 'Kiểm tra tải máy phát điện khẩn cấp',
  'fire_extinguisher': 'Kiểm tra và nạp bình chữa cháy',
  'fire_sprinkler': 'Kiểm tra áp suất vòi phun chữa cháy',
  'marine_construction': 'Cơ sở hạ tầng biển và bến tàu hạng nặng',
  'hvac_balance': 'Kiểm tra và cân bằng HVAC',
  'hydro_excavation': 'Khai đào thủy lực và khai đào không phá hủy',
  'commercial_roofing': 'Mái bằng công nghiệp và thương mại',
  'scrap_metal': 'Chế biến phế liệu kim loại công nghiệp',
  'industrial_wastewater': 'Xử lý nước thải công nghiệp',
  'medical_waste': 'Xử lý chất thải y tế',
  'slurry_concrete': 'Bùn / Hồ xi măng',
  'stormwater_compliance': 'Tuân thủ SWPPP / Nước mưa',
  'tank_testing': 'Kiểm tra bể chứa ngầm',

  // ─── Step bodies (landing) ───
  'enter a zip code. pick a vertical. we scan every company within your radius — contractors, subs, suppliers.':
    'Nhập mã bưu điện. Chọn lĩnh vực. Chúng tôi quét mọi công ty trong bán kính của bạn — nhà thầu, nhà thầu phụ, nhà cung cấp.',
  'our ai ranks companies by revenue signals, fleet size, and buying intent. you see who\'s ready to spend.':
    'AI của chúng tôi xếp hạng công ty theo tín hiệu doanh thu, quy mô đội xe và ý định mua hàng. Bạn thấy ai sẵn sàng chi tiêu.',
  'one-tap calling, auto-enriched contacts, and ai-drafted bid proposals. done before the next pour.':
    'Gọi một chạm, danh bạ tự động làm giàu và đề xuất đấu thầu do AI soạn thảo. Hoàn thành trước lần đổ bê tông tiếp theo.',

  // ─── Engine titles (landing) ───
  'discovery engine': 'Động cơ khám phá',
  'enrichment engine': 'Động cơ làm giàu',
  'scoring engine': 'Động cơ đánh giá',
  'campaign engine': 'Động cơ chiến dịch',

  // ─── Engine descriptions (landing) ───
  'search 8+ verticals with geo-intelligence and industry signals. find companies your competitors don\'t know exist.':
    'Tìm kiếm hơn 8 lĩnh vực với thông tin địa lý và tín hiệu ngành. Tìm công ty mà đối thủ của bạn không biết tồn tại.',
  'auto-populate verified contacts, phones, emails, and decision-maker data for every company found.':
    'Tự động điền danh bạ, điện thoại, email và dữ liệu người ra quyết định đã xác minh cho mọi công ty được tìm thấy.',
  'priority rankings based on revenue, fleet, permit activity, and buying signals. know who to call first.':
    'Xếp hạng ưu tiên dựa trên doanh thu, đội xe, hoạt động giấy phép và tín hiệu mua hàng. Biết ai cần gọi trước.',
  'deploy targeted outreach and track every touchpoint from first call to signed contract.':
    'Triển khai tiếp cận mục tiêu và theo dõi mọi điểm tiếp xúc từ cuộc gọi đầu tiên đến hợp đồng đã ký.',
  'every function you need to prospect, enrich, score, and close — unified in a single field-hardened interface built for construction teams.':
    'Mọi chức năng bạn cần để khảo sát, làm giàu, đánh giá và chốt — thống nhất trong một giao diện chắc chắn được xây dựng cho đội ngũ xây dựng.',

  // ─── CTA body ───
  'book a 20-minute demo. we\'ll map your market live and show you exactly where the revenue is — before your competitors find it.':
    'Đặt lịch demo 20 phút. Chúng tôi sẽ lập bản đồ thị trường của bạn trực tiếp và chỉ cho bạn chính xác doanh thu ở đâu — trước khi đối thủ của bạn tìm thấy nó.',
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
