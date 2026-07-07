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

  // ─── Dashboard shell & sidebar ───
  'project workspace': 'Espacio de trabajo del proyecto',
  'vendors': 'Proveedores',
  'projects': 'Proyectos',
  'command center': 'Centro de Comando',
  'search intelligence': 'Inteligencia de Búsqueda',
  'logistics intelligence': 'Inteligencia Logística',
  'equipment exchange': 'Intercambio de Equipos',
  'bid intelligence': 'Inteligencia de Licitaciones',
  'global exploration hub': 'Centro de Exploración Global',
  'new': 'Nuevo',
  'construction market intelligence dashboard': 'Panel de Inteligencia de Mercado para la Construcción',

  // ─── Topbar workspace descriptions ───
  'find operators, facilities, equipment, and regulatory records': 'Encuentre operadores, instalaciones, equipos y registros regulatorios',
  'route analysis, cost modeling, and crew planning': 'Análisis de rutas, modelado de costos y planificación de cuadrillas',
  'rental comparison, availability, and rate intelligence': 'Comparación de alquileres, disponibilidad e inteligencia de tarifas',
  'scope analysis, cost breakdown, and proposal generation': 'Análisis de alcance, desglose de costos y generación de propuestas',
  'daily intelligence hub, bid feed, and market trends': 'Centro de inteligencia diaria, feed de licitaciones y tendencias del mercado',

  // ─── Search console ───
  'gallons': 'Galones',
  'est. volume': 'Vol. estimado',
  'select a tab to begin': 'Seleccione una pestaña para comenzar',
  'search disposal': 'Buscar Vertedero',
  'search labor': 'Buscar Mano de Obra',

  // ─── Results view ───
  'confidence': 'Confiabilidad',
  'permits': 'Permisos',
  'licenses': 'Licencias',
  'detected services & equipment': 'Servicios y equipos detectados',
  'matched keywords': 'Palabras clave coincidentes',
  'scraped keywords': 'Palabras clave extraídas',
  'ai summary': 'Resumen de IA',
  'hauling & disposal estimate': 'Estimación de acarreo y eliminación',
  'trips required': 'Viajes requeridos',
  'total cycle': 'Ciclo total',
  'hauling cost': 'Costo de acarreo',
  'disposal fee': 'Tarifa de eliminación',
  'total estimated cost': 'Costo total estimado',
  'cost per gallon': 'Costo por galón',
  'grouped': 'Agrupado',
  'compare': 'Comparar',
  'graph': 'Gráfico',
  'search failed — try again or contact support': 'Búsqueda fallida — intente de nuevo o contacte a soporte',
  'active permit': 'Permiso Activo',
  'permit': 'Permiso',
  'permit status': 'Estado del Permiso',
  'vendor': 'Proveedor',
  'fit': 'Ajuste',
  'haul cost': 'Costo de Acarreo',

  // ─── Command center ───
  'recent activity': 'Actividad Reciente',
  'view all': 'Ver Todo',
  'new search': 'Nueva Búsqueda',
  'quick actions': 'Acciones Rápidas',
  'find operators, facilities & equipment': 'Encuentre operadores, instalaciones y equipos',
  'route analysis, cost modeling & crew planning': 'Análisis de rutas, modelado de costos y planificación de cuadrillas',
  'scope analysis, cost breakdown & proposal generation': 'Análisis de alcance, desglose de costos y generación de propuestas',
  'rental comparison, availability & rates': 'Comparación de alquileres, disponibilidad y tarifas',
  'project pipeline': 'Canalización de Proyectos',
  'create a project to see it here': 'Cree un proyecto para verlo aquí',
  'no recent activity': 'Sin actividad reciente',
  'create a project to get started': 'Cree un proyecto para comenzar',

  // ─── Search intelligence ───
  'find operators, disposal facilities, equipment, or regulatory records': 'Encuentre operadores, vertederos, equipos o registros regulatorios',
  'vertical': 'Vertical',
  'volume (gal)': 'Volumen (gal)',
  'advanced filters': 'Filtros Avanzados',
  'min confidence': 'Confiabilidad mín.',
  'operator type': 'Tipo de Operador',
  'direct operators only': 'Solo operadores directos',
  'permit required': 'Permiso requerido',
  'active permits only': 'Solo permisos activos',
  'min rating': 'Calificación mín.',
  'select a vertical': 'Seleccione una vertical',

  // ─── Logistics intelligence ───
  'route analysis, cost modeling, crew planning, and vendor comparison': 'Análisis de rutas, modelado de costos, planificación de cuadrillas y comparación de proveedores',
  'vendor cost comparison': 'Comparación de Costos de Proveedores',
  'run a search in Search Intelligence to populate vendor data here.': 'Ejecute una búsqueda en Inteligencia de Búsqueda para poblar datos de proveedores aquí.',

  // ─── Equipment exchange ───
  'select or create a project workspace to book equipment.': 'Seleccione o cree un proyecto para reservar equipos.',
  'no active project': 'Sin proyecto activo',
  'create a project from the sidebar to book equipment.': 'Cree un proyecto desde la barra lateral para reservar equipos.',
  'rental comparison, availability, delivery ETA, and rate intelligence': 'Comparación de alquileres, disponibilidad, ETA de entrega e inteligencia de tarifas',
  'active project': 'Proyecto Activo',
  'units booked': 'unidades reservadas',
  'equipment type': 'Tipo de Equipo',
  'all types': 'Todos los tipos',
  'location': 'Ubicación',
  'delivery date': 'Fecha de Entrega',
  'search equipment': 'Buscar Equipo',
  'rental partner': 'Socio de Alquiler',
  'status': 'Estado',
  'daily rate': 'Tarifa Diaria',
  'delivery': 'Entrega',
  'total': 'Total',
  'action': 'Acción',
  'available': 'Disponible',
  'unavailable': 'No Disponible',
  'release': 'Liberar',
  'reserve': 'Reservar',
  'no equipment found for this area': 'No se encontraron equipos para esta área',
  'searching equipment inventory...': 'Buscando inventario de equipos...',

  // ─── Bid intelligence ───
  'select or create a project workspace to enable bid analysis.': 'Seleccione o cree un proyecto para habilitar el análisis de licitaciones.',
  'create a project from the sidebar to analyze bids.': 'Cree un proyecto desde la barra lateral para analizar licitaciones.',
  'scope analysis, cost breakdown, vendor recommendations, and proposal generation': 'Análisis de alcance, desglose de costos, recomendaciones de proveedores y generación de propuestas',
  'scope analysis': 'Análisis de Alcance',
  'paste scope description, upload PDF, or describe the project...': 'Pegue la descripción del alcance, suba un PDF o describa el proyecto...',
  'upload PDF': 'Subir PDF',
  'upload plans': 'Subir Planos',
  'or type scope details above': 'o escriba detalles del alcance arriba',
  'extracting...': 'Extrayendo...',
  'analyze scope': 'Analizar Alcance',
  'ai parser scanning': 'Escaneo del analizador de IA',
  'extracted parameters': 'Parámetros Extraídos',
  'work spec': 'Especificación de Trabajo',
  'volume': 'Volumen',
  'download proposal': 'Descargar Propuesta',
  'profitability engine': 'Motor de Rentabilidad',
  'contract revenue ($)': 'Ingresos del Contrato ($)',
  'labor cost ($)': 'Costo de Mano de Obra ($)',
  'equipment rent': 'Alquiler de Equipos',
  'contingency buffer': 'Colchón de Contingencia',
  'gross profit': 'Ganancia Bruta',
  'margin': 'Margen',
  'risk score': 'Puntuación de Riesgo',
  'margin critical — zero contingency safety net': 'Margen crítico — red de seguridad de contingencia cero',
  'margin within standard variance — keep contingency above 10%': 'Margen dentro de la varianza estándar — mantenga la contingencia por encima del 10%',
  'highly profitable — auto-lock bidding targets': 'Altamente rentable — bloqueo automático de objetivos de licitación',
  'critical': 'Crítico',
  'medium': 'Medio',
  'optimal': 'Óptimo',
  'scanning project specification headers...': 'Escaneando encabezados de especificaciones del proyecto...',
  'extracting work spec requirements & waste definitions...': 'Extrayendo requisitos de especificaciones y definiciones de residuos...',
  'resolving environmental compliance codes...': 'Resolviendo códigos de cumplimiento ambiental...',
  'generating bid proposal draft...': 'Generando borrador de propuesta de licitación...',
  'ai parameter parsing complete.': 'Análisis de parámetros de IA completo.',

  // ─── Market intelligence ───
  'market data unavailable — check API configuration': 'Datos de mercado no disponibles — verifique la configuración de la API',
  'loading market data...': 'Cargando datos de mercado...',
  'bid feed': 'Feed de Licitaciones',
  'industry news': 'Noticias de la Industria',
  'permit activity': 'Actividad de Permisos',
  'open leads': 'Clientes Potenciales Abiertos',
  'active permits': 'Permisos Activos',
  'market activity': 'Actividad del Mercado',
  'web coverage': 'Cobertura Web',

  // ─── Saved items ───
  'saved searches': 'Búsquedas Guardadas',
  'saved vendors': 'Proveedores Guardados',
  'your saved search configurations will appear here.': 'Sus configuraciones de búsqueda guardadas aparecerán aquí.',
  'your bookmarked vendors, facilities, and operators will appear here.': 'Sus proveedores, instalaciones y operadores marcados aparecerán aquí.',
  'your active and archived projects will appear here.': 'Sus proyectos activos y archivados aparecerán aquí.',

  // ─── Intelligence rail ───
  'daily intelligence hub': 'Centro de Inteligencia Diaria',
  'market summary': 'Resumen del Mercado',
  'region snapshot': 'Instantánea de la Región',
  'active facilities': 'Instalaciones Activas',
  'permits expiring': 'Permisos por Vencer',
  'open bids': 'Licitaciones Abiertas',
  'companies in pipeline': 'Empresas en Canalización',
  'from market discovery engine': 'Del motor de descubrimiento de mercado',
  'active permits tracked': 'Permisos Activos Rastreados',
  'regulatory compliance monitoring': 'Monitoreo de cumplimiento regulatorio',

  // ─── Logistics controller ───
  'logistics controller': 'Controlador Logístico',
  'adjust parameters to see live cost projections': 'Ajuste parámetros para ver proyecciones de costos en vivo',
  'load': 'Carga',
  'target volume': 'Volumen Objetivo',
  'traffic conditions': 'Condiciones de Tráfico',
  'crew size': 'Tamaño de Cuadrilla',
  'truck capacity': 'Capacidad del Camión',
  'hauls required': 'Acarreos Requeridos',
  'total transit': 'Tránsito Total',
  'operation time': 'Tiempo de Operación',
  'fuel estimate': 'Estimación de Combustible',
  'total cost': 'Costo Total',
  'traffic': 'Tráfico',
  'crew': 'Cuadrilla',
  'effective speed': 'Velocidad Efectiva',
  'normal': 'Normal',
  'heavy': 'Pesado',
  'extreme': 'Extremo',
  'driver only': 'Solo Conductor',
  'driver + helper': 'Conductor + Ayudante',
  'multi crew': 'Múltiples Cuadrillas',

  // ─── Command bar ───
  'ask hhr copilot...': 'Pregunte al copiloto de HHR...',
  'try: find slurry disposal near fremont': 'Intente: buscar eliminación de lodos cerca de Fremont',
  'show disposal only': 'Mostrar solo eliminación',
  'increase radius to 50 mi': 'Aumentar radio a 50 mi',

  // ─── Results graph ───
  'ontology graph': 'Grafo de Ontología',
  'no results to display in graph view': 'Sin resultados para mostrar en la vista de gráfico',

  // ─── Miscellaneous ───
  '© 2026 hard hat required. all rights reserved.': '© 2026 Hard Hat Required. Todos los derechos reservados.',
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

  // ─── Dashboard shell & sidebar ───
  'project workspace': '项目工作区',
  'vendors': '供应商',
  'projects': '项目',
  'command center': '指挥中心',
  'search intelligence': '搜索智能',
  'logistics intelligence': '物流智能',
  'equipment exchange': '设备交换',
  'bid intelligence': '投标智能',
  'global exploration hub': '全球探索中心',
  'new': '新建',
  'construction market intelligence dashboard': '建筑市场智能面板',

  // ─── Topbar workspace descriptions ───
  'find operators, facilities, equipment, and regulatory records': '查找操作员、设施、设备和监管记录',
  'route analysis, cost modeling, and crew planning': '路线分析、成本建模和团队规划',
  'rental comparison, availability, and rate intelligence': '租赁比较、可用性和费率智能',
  'scope analysis, cost breakdown, and proposal generation': '范围分析、成本分解和提案生成',
  'daily intelligence hub, bid feed, and market trends': '每日情报中心、投标推送和市场趋势',

  // ─── Search console ───
  'gallons': '加仑',
  'est. volume': '预估量',
  'select a tab to begin': '选择选项卡开始',
  'search disposal': '搜索处置',
  'search labor': '搜索劳动力',

  // ─── Results view ───
  'confidence': '置信度',
  'permits': '许可证',
  'licenses': '执照',
  'detected services & equipment': '检测到的服务与设备',
  'matched keywords': '匹配的关键词',
  'scraped keywords': '抓取的关键词',
  'ai summary': 'AI摘要',
  'hauling & disposal estimate': '运输与处置估算',
  'trips required': '所需趟数',
  'total cycle': '总周期',
  'hauling cost': '运输成本',
  'disposal fee': '处置费',
  'total estimated cost': '预估总成本',
  'cost per gallon': '每加仑成本',
  'grouped': '分组',
  'compare': '比较',
  'graph': '图表',
  'search failed — try again or contact support': '搜索失败 — 请重试或联系支持',
  'active permit': '有效许可证',
  'permit': '许可证',
  'permit status': '许可证状态',
  'vendor': '供应商',
  'fit': '匹配度',
  'haul cost': '运输成本',

  // ─── Command center ───
  'recent activity': '最近活动',
  'view all': '查看全部',
  'new search': '新搜索',
  'quick actions': '快速操作',
  'find operators, facilities & equipment': '查找操作员、设施和设备',
  'route analysis, cost modeling & crew planning': '路线分析、成本建模和团队规划',
  'scope analysis, cost breakdown & proposal generation': '范围分析、成本分解和提案生成',
  'rental comparison, availability & rates': '租赁比较、可用性和费率',
  'project pipeline': '项目管道',
  'create a project to see it here': '创建项目即可在此查看',
  'no recent activity': '暂无最近活动',
  'create a project to get started': '创建项目以开始使用',

  // ─── Search intelligence ───
  'find operators, disposal facilities, equipment, or regulatory records': '查找操作员、处置设施、设备或监管记录',
  'vertical': '垂直领域',
  'volume (gal)': '体积（加仑）',
  'advanced filters': '高级筛选',
  'min confidence': '最低置信度',
  'operator type': '操作员类型',
  'direct operators only': '仅直接操作员',
  'permit required': '需要许可证',
  'active permits only': '仅有效许可证',
  'min rating': '最低评分',
  'select a vertical': '选择一个垂直领域',

  // ─── Logistics intelligence ───
  'route analysis, cost modeling, crew planning, and vendor comparison': '路线分析、成本建模、团队规划和供应商比较',
  'vendor cost comparison': '供应商成本比较',
  'run a search in Search Intelligence to populate vendor data here.': '在搜索智能中运行搜索以在此填充供应商数据。',

  // ─── Equipment exchange ───
  'select or create a project workspace to book equipment.': '选择或创建项目工作区以预订设备。',
  'no active project': '无活跃项目',
  'create a project from the sidebar to book equipment.': '从侧边栏创建项目以预订设备。',
  'rental comparison, availability, delivery ETA, and rate intelligence': '租赁比较、可用性、预计交付时间和费率智能',
  'active project': '活跃项目',
  'units booked': '已预订数量',
  'equipment type': '设备类型',
  'all types': '所有类型',
  'location': '位置',
  'delivery date': '交付日期',
  'search equipment': '搜索设备',
  'rental partner': '租赁伙伴',
  'status': '状态',
  'daily rate': '每日费率',
  'delivery': '交付',
  'total': '总计',
  'action': '操作',
  'available': '可用',
  'unavailable': '不可用',
  'release': '释放',
  'reserve': '预订',
  'no equipment found for this area': '该区域未找到设备',
  'searching equipment inventory...': '正在搜索设备库存...',

  // ─── Bid intelligence ───
  'select or create a project workspace to enable bid analysis.': '选择或创建项目工作区以启用投标分析。',
  'create a project from the sidebar to analyze bids.': '从侧边栏创建项目以分析投标。',
  'scope analysis, cost breakdown, vendor recommendations, and proposal generation': '范围分析、成本分解、供应商建议和提案生成',
  'scope analysis': '范围分析',
  'paste scope description, upload PDF, or describe the project...': '粘贴范围描述、上传PDF或描述项目...',
  'upload PDF': '上传PDF',
  'upload plans': '上传计划',
  'or type scope details above': '或在上方输入范围详情',
  'extracting...': '正在提取...',
  'analyze scope': '分析范围',
  'ai parser scanning': 'AI解析器扫描中',
  'extracted parameters': '已提取参数',
  'work spec': '工作规范',
  'volume': '体积',
  'download proposal': '下载提案',
  'profitability engine': '盈利引擎',
  'contract revenue ($)': '合同收入（$）',
  'labor cost ($)': '人工成本（$）',
  'equipment rent': '设备租金',
  'contingency buffer': '应急缓冲',
  'gross profit': '毛利润',
  'margin': '利润率',
  'risk score': '风险评分',
  'margin critical — zero contingency safety net': '利润率危急 — 零应急安全网',
  'margin within standard variance — keep contingency above 10%': '利润率在标准范围内 — 保持应急缓冲超过10%',
  'highly profitable — auto-lock bidding targets': '高利润 — 自动锁定投标目标',
  'critical': '危急',
  'medium': '中等',
  'optimal': '最优',
  'scanning project specification headers...': '正在扫描项目规范标题...',
  'extracting work spec requirements & waste definitions...': '正在提取工作规范要求和废物定义...',
  'resolving environmental compliance codes...': '正在解析环境合规代码...',
  'generating bid proposal draft...': '正在生成投标提案草稿...',
  'ai parameter parsing complete.': 'AI参数解析完成。',

  // ─── Market intelligence ───
  'market data unavailable — check API configuration': '市场数据不可用 — 检查API配置',
  'loading market data...': '正在加载市场数据...',
  'bid feed': '投标推送',
  'industry news': '行业新闻',
  'permit activity': '许可证活动',
  'open leads': '开放线索',
  'active permits': '有效许可证',
  'market activity': '市场活动',
  'web coverage': '网络覆盖',

  // ─── Saved items ───
  'saved searches': '已保存的搜索',
  'saved vendors': '已保存的供应商',
  'your saved search configurations will appear here.': '您保存的搜索配置将显示在此处。',
  'your bookmarked vendors, facilities, and operators will appear here.': '您收藏的供应商、设施和操作员将显示在此处。',
  'your active and archived projects will appear here.': '您的活跃和归档项目将显示在此处。',

  // ─── Intelligence rail ───
  'daily intelligence hub': '每日情报中心',
  'market summary': '市场摘要',
  'region snapshot': '区域快照',
  'active facilities': '活跃设施',
  'permits expiring': '即将到期的许可证',
  'open bids': '公开投标',
  'companies in pipeline': '管道中的公司',
  'from market discovery engine': '来自市场发现引擎',
  'active permits tracked': '追踪到的有效许可证',
  'regulatory compliance monitoring': '法规合规监控',

  // ─── Logistics controller ───
  'logistics controller': '物流控制器',
  'adjust parameters to see live cost projections': '调整参数查看实时成本预测',
  'load': '负载',
  'target volume': '目标体积',
  'traffic conditions': '交通状况',
  'crew size': '团队规模',
  'truck capacity': '卡车容量',
  'hauls required': '所需运输次数',
  'total transit': '总运输',
  'operation time': '操作时间',
  'fuel estimate': '燃料估算',
  'total cost': '总成本',
  'traffic': '交通',
  'crew': '团队',
  'effective speed': '有效速度',
  'normal': '正常',
  'heavy': '繁忙',
  'extreme': '极端',
  'driver only': '仅司机',
  'driver + helper': '司机+助手',
  'multi crew': '多团队',

  // ─── Command bar ───
  'ask hhr copilot...': '询问HHR助手...',
  'try: find slurry disposal near fremont': '尝试：查找弗里蒙特附近的泥浆处置',
  'show disposal only': '仅显示处置',
  'increase radius to 50 mi': '将半径增加到50英里',

  // ─── Results graph ───
  'ontology graph': '本体图',
  'no results to display in graph view': '图表视图中没有可显示的结果',

  // ─── Miscellaneous ───
  '© 2026 hard hat required. all rights reserved.': '© 2026 Hard Hat Required. 保留所有权利。',
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

  // ─── Dashboard shell & sidebar ───
  'project workspace': 'Không gian làm việc dự án',
  'vendors': 'Nhà cung cấp',
  'projects': 'Dự án',
  'command center': 'Trung tâm chỉ huy',
  'search intelligence': 'Thông tin tìm kiếm',
  'logistics intelligence': 'Thông tin hậu cần',
  'equipment exchange': 'Trao đổi thiết bị',
  'bid intelligence': 'Thông tin đấu thầu',
  'global exploration hub': 'Trung tâm khám phá toàn cầu',
  'new': 'Mới',
  'construction market intelligence dashboard': 'Bảng điều khiển thông tin thị trường xây dựng',

  // ─── Topbar workspace descriptions ───
  'find operators, facilities, equipment, and regulatory records': 'Tìm nhà điều hành, cơ sở, thiết bị và hồ sơ quy định',
  'route analysis, cost modeling, and crew planning': 'Phân tích tuyến đường, mô hình chi phí và lập kế hoạch nhân công',
  'rental comparison, availability, and rate intelligence': 'So sánh giá thuê, tình trạng sẵn có và thông tin giá cước',
  'scope analysis, cost breakdown, and proposal generation': 'Phân tích phạm vi, phân tích chi phí và tạo đề xuất',
  'daily intelligence hub, bid feed, and market trends': 'Trung tâm thông tin hàng ngày, nguồn đấu thầu và xu hướng thị trường',

  // ─── Search console ───
  'gallons': 'Galông',
  'est. volume': 'KL ước tính',
  'select a tab to begin': 'Chọn một tab để bắt đầu',
  'search disposal': 'Tìm kiếm xử lý',
  'search labor': 'Tìm kiếm nhân công',

  // ─── Results view ───
  'confidence': 'Độ tin cậy',
  'permits': 'Giấy phép',
  'licenses': 'Giấy phép hành nghề',
  'detected services & equipment': 'Dịch vụ & thiết bị được phát hiện',
  'matched keywords': 'Từ khóa phù hợp',
  'scraped keywords': 'Từ khóa thu thập được',
  'ai summary': 'Tóm tắt AI',
  'hauling & disposal estimate': 'Ước tính vận chuyển & xử lý',
  'trips required': 'Số chuyến cần thiết',
  'total cycle': 'Tổng chu kỳ',
  'hauling cost': 'Chi phí vận chuyển',
  'disposal fee': 'Phí xử lý',
  'total estimated cost': 'Tổng chi phí ước tính',
  'cost per gallon': 'Chi phí mỗi galông',
  'grouped': 'Nhóm',
  'compare': 'So sánh',
  'graph': 'Biểu đồ',
  'search failed — try again or contact support': 'Tìm kiếm thất bại — hãy thử lại hoặc liên hệ hỗ trợ',
  'active permit': 'Giấy phép hiệu lực',
  'permit': 'Giấy phép',
  'permit status': 'Tình trạng giấy phép',
  'vendor': 'Nhà cung cấp',
  'fit': 'Phù hợp',
  'haul cost': 'Chi phí vận chuyển',

  // ─── Command center ───
  'recent activity': 'Hoạt động gần đây',
  'view all': 'Xem tất cả',
  'new search': 'Tìm kiếm mới',
  'quick actions': 'Hành động nhanh',
  'find operators, facilities & equipment': 'Tìm nhà điều hành, cơ sở & thiết bị',
  'route analysis, cost modeling & crew planning': 'Phân tích tuyến đường, mô hình chi phí & lập kế hoạch nhân công',
  'scope analysis, cost breakdown & proposal generation': 'Phân tích phạm vi, phân tích chi phí & tạo đề xuất',
  'rental comparison, availability & rates': 'So sánh giá thuê, tình trạng sẵn có & giá cước',
  'project pipeline': 'Quy trình dự án',
  'create a project to see it here': 'Tạo dự án để xem ở đây',
  'no recent activity': 'Không có hoạt động gần đây',
  'create a project to get started': 'Tạo dự án để bắt đầu',

  // ─── Search intelligence ───
  'find operators, disposal facilities, equipment, or regulatory records': 'Tìm nhà điều hành, cơ sở xử lý, thiết bị hoặc hồ sơ quy định',
  'vertical': 'Lĩnh vực',
  'volume (gal)': 'Thể tích (gal)',
  'advanced filters': 'Bộ lọc nâng cao',
  'min confidence': 'Độ tin cậy tối thiểu',
  'operator type': 'Loại nhà điều hành',
  'direct operators only': 'Chỉ nhà điều hành trực tiếp',
  'permit required': 'Yêu cầu giấy phép',
  'active permits only': 'Chỉ giấy phép hiệu lực',
  'min rating': 'Xếp hạng tối thiểu',
  'select a vertical': 'Chọn một lĩnh vực',

  // ─── Logistics intelligence ───
  'route analysis, cost modeling, crew planning, and vendor comparison': 'Phân tích tuyến đường, mô hình chi phí, lập kế hoạch nhân công và so sánh nhà cung cấp',
  'vendor cost comparison': 'So sánh chi phí nhà cung cấp',
  'run a search in Search Intelligence to populate vendor data here.': 'Chạy tìm kiếm trong Thông tin Tìm kiếm để điền dữ liệu nhà cung cấp tại đây.',

  // ─── Equipment exchange ───
  'select or create a project workspace to book equipment.': 'Chọn hoặc tạo không gian làm việc dự án để đặt thiết bị.',
  'no active project': 'Không có dự án đang hoạt động',
  'create a project from the sidebar to book equipment.': 'Tạo dự án từ thanh bên để đặt thiết bị.',
  'rental comparison, availability, delivery ETA, and rate intelligence': 'So sánh giá thuê, tình trạng sẵn có, thời gian giao hàng dự kiến và thông tin giá cước',
  'active project': 'Dự án đang hoạt động',
  'units booked': 'đơn vị đã đặt',
  'equipment type': 'Loại thiết bị',
  'all types': 'Tất cả loại',
  'location': 'Vị trí',
  'delivery date': 'Ngày giao hàng',
  'search equipment': 'Tìm kiếm thiết bị',
  'rental partner': 'Đối tác cho thuê',
  'status': 'Trạng thái',
  'daily rate': 'Giá theo ngày',
  'delivery': 'Giao hàng',
  'total': 'Tổng cộng',
  'action': 'Hành động',
  'available': 'Có sẵn',
  'unavailable': 'Không có sẵn',
  'release': 'Giải phóng',
  'reserve': 'Đặt trước',
  'no equipment found for this area': 'Không tìm thấy thiết bị cho khu vực này',
  'searching equipment inventory...': 'Đang tìm kiếm kho thiết bị...',

  // ─── Bid intelligence ───
  'select or create a project workspace to enable bid analysis.': 'Chọn hoặc tạo không gian làm việc dự án để bật phân tích đấu thầu.',
  'create a project from the sidebar to analyze bids.': 'Tạo dự án từ thanh bên để phân tích đấu thầu.',
  'scope analysis, cost breakdown, vendor recommendations, and proposal generation': 'Phân tích phạm vi, phân tích chi phí, đề xuất nhà cung cấp và tạo đề xuất',
  'scope analysis': 'Phân tích phạm vi',
  'paste scope description, upload PDF, or describe the project...': 'Dán mô tả phạm vi, tải lên PDF hoặc mô tả dự án...',
  'upload PDF': 'Tải lên PDF',
  'upload plans': 'Tải lên bản vẽ',
  'or type scope details above': 'hoặc nhập chi tiết phạm vi ở trên',
  'extracting...': 'Đang trích xuất...',
  'analyze scope': 'Phân tích phạm vi',
  'ai parser scanning': 'Trình phân tích AI đang quét',
  'extracted parameters': 'Tham số đã trích xuất',
  'work spec': 'Đặc tả công việc',
  'volume': 'Thể tích',
  'download proposal': 'Tải xuống đề xuất',
  'profitability engine': 'Công cụ lợi nhuận',
  'contract revenue ($)': 'Doanh thu hợp đồng ($)',
  'labor cost ($)': 'Chi phí nhân công ($)',
  'equipment rent': 'Thuê thiết bị',
  'contingency buffer': 'Dự phòng rủi ro',
  'gross profit': 'Lợi nhuận gộp',
  'margin': 'Biên lợi nhuận',
  'risk score': 'Điểm rủi ro',
  'margin critical — zero contingency safety net': 'Biên lợi nhuận nguy kịch — không có dự phòng an toàn',
  'margin within standard variance — keep contingency above 10%': 'Biên lợi nhuận trong khoảng chuẩn — giữ dự phòng trên 10%',
  'highly profitable — auto-lock bidding targets': 'Lợi nhuận cao — tự động khóa mục tiêu đấu thầu',
  'critical': 'Nguy kịch',
  'medium': 'Trung bình',
  'optimal': 'Tối ưu',
  'scanning project specification headers...': 'Đang quét tiêu đề đặc tả dự án...',
  'extracting work spec requirements & waste definitions...': 'Đang trích xuất yêu cầu đặc tả công việc và định nghĩa chất thải...',
  'resolving environmental compliance codes...': 'Đang giải quyết mã tuân thủ môi trường...',
  'generating bid proposal draft...': 'Đang tạo bản nháp đề xuất đấu thầu...',
  'ai parameter parsing complete.': 'Phân tích tham số AI hoàn tất.',

  // ─── Market intelligence ───
  'market data unavailable — check API configuration': 'Dữ liệu thị trường không khả dụng — kiểm tra cấu hình API',
  'loading market data...': 'Đang tải dữ liệu thị trường...',
  'bid feed': 'Nguồn đấu thầu',
  'industry news': 'Tin tức ngành',
  'permit activity': 'Hoạt động giấy phép',
  'open leads': 'Khách hàng tiềm năng mở',
  'active permits': 'Giấy phép hiệu lực',
  'market activity': 'Hoạt động thị trường',
  'web coverage': 'Phạm vi web',

  // ─── Saved items ───
  'saved searches': 'Tìm kiếm đã lưu',
  'saved vendors': 'Nhà cung cấp đã lưu',
  'your saved search configurations will appear here.': 'Cấu hình tìm kiếm đã lưu của bạn sẽ xuất hiện ở đây.',
  'your bookmarked vendors, facilities, and operators will appear here.': 'Các nhà cung cấp, cơ sở và nhà điều hành đã đánh dấu của bạn sẽ xuất hiện ở đây.',
  'your active and archived projects will appear here.': 'Các dự án đang hoạt động và đã lưu trữ của bạn sẽ xuất hiện ở đây.',

  // ─── Intelligence rail ───
  'daily intelligence hub': 'Trung tâm thông tin hàng ngày',
  'market summary': 'Tóm tắt thị trường',
  'region snapshot': 'Ảnh chụp khu vực',
  'active facilities': 'Cơ sở đang hoạt động',
  'permits expiring': 'Giấy phép sắp hết hạn',
  'open bids': 'Đấu thầu mở',
  'companies in pipeline': 'Công ty trong quy trình',
  'from market discovery engine': 'Từ công cụ khám phá thị trường',
  'active permits tracked': 'Giấy phép hiệu lực được theo dõi',
  'regulatory compliance monitoring': 'Giám sát tuân thủ quy định',

  // ─── Logistics controller ───
  'logistics controller': 'Bộ điều khiển hậu cần',
  'adjust parameters to see live cost projections': 'Điều chỉnh tham số để xem dự báo chi phí trực tiếp',
  'load': 'Tải',
  'target volume': 'Khối lượng mục tiêu',
  'traffic conditions': 'Điều kiện giao thông',
  'crew size': 'Quy mô nhân công',
  'truck capacity': 'Sức chứa xe tải',
  'hauls required': 'Số chuyến cần thiết',
  'total transit': 'Tổng vận chuyển',
  'operation time': 'Thời gian vận hành',
  'fuel estimate': 'Ước tính nhiên liệu',
  'total cost': 'Tổng chi phí',
  'traffic': 'Giao thông',
  'crew': 'Nhân công',
  'effective speed': 'Tốc độ hiệu quả',
  'normal': 'Bình thường',
  'heavy': 'Đông đúc',
  'extreme': 'Cực độ',
  'driver only': 'Chỉ tài xế',
  'driver + helper': 'Tài xế + phụ',
  'multi crew': 'Nhiều nhân công',

  // ─── Command bar ───
  'ask hhr copilot...': 'Hỏi trợ lý HHR...',
  'try: find slurry disposal near fremont': 'Thử: tìm bãi xử lý bùn gần Fremont',
  'show disposal only': 'Chỉ hiển thị xử lý',
  'increase radius to 50 mi': 'Tăng bán kính lên 50 dặm',

  // ─── Results graph ───
  'ontology graph': 'Đồ thị bản thể học',
  'no results to display in graph view': 'Không có kết quả để hiển thị trong chế độ xem đồ thị',

  // ─── Miscellaneous ───
  '© 2026 hard hat required. all rights reserved.': '© 2026 Hard Hat Required. Mọi quyền được bảo lưu.',
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
