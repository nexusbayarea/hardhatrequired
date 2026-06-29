'use client';

import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const esDictionary: Record<string, string> = {
  'daily intelligence': 'Inteligencia Diaria',
  'active bids': 'Licitaciones Activas',
  'compliance': 'Cumplimiento Normativo',
  'market intelligence': 'Generación de Clientes Potenciales',
  'lead generation': 'Generación de Clientes Potenciales',
  'industry index': 'Índice de la Industria',
  'win more contracts': 'Gane Más Contratos',
  'contractor intelligence': 'Inteligencia de Contratistas',
  'osha violation risk': 'Riesgo de Infracción de OSHA',
  'hard hat required': 'Hard Hat Required',
  'search radius': 'Radio de Búsqueda',
  'run discovery': 'Ejecutar Búsqueda',
  'enter zip code': 'Ingrese el Código Postal',
  'select index type': 'Seleccionar Tipo de Índice',
  'source': 'Fuente',
  'score': 'Puntaje',
  'grade': 'Grado',
  'phone': 'Teléfono',
  'email': 'Correo Electrónico',
  'website': 'Sitio Web',
  'distance': 'Distancia',
  'pipeline': 'Tubería de Ventas',
  'campaigns': 'Campañas',
  'reports': 'Informes',
  'settings': 'Configuración',
  'login': 'Iniciar Sesión',
  'get access': 'Obtener Acceso',
  'english': 'English',
  'español': 'Español',
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
  'construction market intelligence': 'Inteligencia de Mercado para la Construcción',
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
  'login': 'Iniciar Sesión',
  'get access': 'Obtener Acceso',
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [loading, setLoading] = useState(false);

  const setLanguage = async (targetLang: Language) => {
    if (targetLang === 'en') {
      setLanguageState('en');
      return;
    }
    setLoading(true);
    setLanguageState(targetLang);
    setLoading(false);
  };

  const t = (text: string): string => {
    if (language === 'en') return text;
    return esDictionary[text.trim().toLowerCase()] || text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
