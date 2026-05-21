import { useState } from 'react';
import GtiReader from '../components/GtiReader';
import JsonSpecViewer from '../components/JsonSpecViewer';

const PROVIDERS = {
  meta: {
    id: 'meta',
    name: 'Meta API Toolbox',
    logo: '🔵',
    themeColor: 'from-blue-600/20 to-indigo-600/20 border-blue-500/30 text-blue-400',
    hoverRing: 'focus:ring-blue-500 hover:border-blue-500/50',
    status: '🟢 Activo',
    isActive: true,
    gtiCount: 4,
    gtis: [
      {
        id: 'whatsapp',
        name: 'WhatsApp Business API v23.0',
        path: '/api-toolbox/01-meta/whatsapp-business-api-v23.0/GTI-WHATSAPP-BUSINESS-API-v23.0.md',
        status: 'completed'
      },
      {
        id: 'mapi',
        name: 'Marketing API (MAPI)',
        path: '/api-toolbox/01-meta/marketing-api/GTI-META-MARKETING-API.md',
        status: 'completed',
        postmanCollection: '/api-toolbox/01-meta/marketing-api/MAPI-Postman-Collection.json',
        hasSpecs: true
      },
      {
        id: 'capi',
        name: 'Conversions API (CAPI)',
        path: '/api-toolbox/01-meta/conversions-api/GTI-META-CONVERSIONS-API.md',
        status: 'completed'
      },
      {
        id: 'conversion-leads-crm',
        name: 'Conversion Leads CRM',
        path: '/api-toolbox/01-meta/conversions-api/GTI-META-CONVERSION-LEADS-CRM.md',
        status: 'completed'
      }
    ]
  },
  google: {
    id: 'google',
    name: 'Google API Toolbox',
    logo: '🔴',
    themeColor: 'from-red-600/10 via-yellow-600/10 to-green-600/10 border-red-500/20 text-yellow-500',
    hoverRing: 'focus:ring-yellow-500 hover:border-yellow-500/40',
    status: '🟢 Activo',
    isActive: true,
    gtiCount: 1,
    gtis: [
      {
        id: 'google-ads',
        name: 'Google Ads API',
        path: '/api-toolbox/02-google/google-ads-api/GTI-GOOGLE-ADS-API.md',
        status: 'completed'
      }
    ]
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok API Toolbox',
    logo: '⚫',
    themeColor: 'from-slate-800/40 to-slate-900/40 border-slate-700/50 text-slate-400',
    hoverRing: 'focus:ring-slate-500 hover:border-slate-700/80',
    status: '🔲 Pendiente',
    isActive: false,
    gtiCount: 1,
    gtis: [
      {
        id: 'tiktok-marketing',
        name: 'TikTok Marketing API',
        path: '/api-toolbox/03-tiktok/tiktok-marketing-api/GTI-TIKTOK-MARKETING-API.md',
        status: 'pending'
      }
    ]
  }
};

export default function ApiToolbox() {
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS.meta);
  const [selectedGti, setSelectedGti] = useState(PROVIDERS.meta.gtis[0]);
  const [showJsonSpecs, setShowJsonSpecs] = useState(false);

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    setSelectedGti(provider.gtis[0]);
    setShowJsonSpecs(false);
  };

  const handleGtiSelect = (gti) => {
    setSelectedGti(gti);
    setShowJsonSpecs(false);
  };

  return (
    <div className="space-y-8 select-none">
      
      {/* Header Sección */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800/60 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                INTEGRACIÓN Módulo
              </span>
              <span className="text-slate-500 text-xs font-semibold">Horizons API Engine</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              ATLAS API Toolbox 🗺️
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl font-medium leading-relaxed">
              Consola centralizada para explorar la documentación técnica (GTIs), esquemas JSON oficiales y colecciones de herramientas de integraciones con Meta, Google y TikTok.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de 3 Tarjetas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.values(PROVIDERS).map((provider) => {
          const isSelected = selectedProvider.id === provider.id;
          return (
            <button
              key={provider.id}
              onClick={() => handleProviderSelect(provider)}
              className={`relative overflow-hidden text-left rounded-2xl bg-gradient-to-b ${provider.themeColor} p-6 border transition-all duration-300 shadow-lg ${provider.hoverRing} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 flex flex-col justify-between h-48 group ${
                isSelected ? 'ring-2 ring-emerald-500 border-emerald-500/40' : ''
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-12 -translate-y-12 pointer-events-none group-hover:scale-125 transition-all duration-500" />
              
              <div className="w-full flex items-center justify-between">
                <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{provider.logo}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                  provider.status.includes('Activo') 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  {provider.status}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white leading-tight">
                  {provider.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                  <span>{provider.gtiCount} {provider.gtiCount > 1 ? 'GTIs Disponibles' : 'GTI Disponible'}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Panel Detalle de Proveedor */}
      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Barra Lateral: Documentos e Interfaces del Proveedor */}
        <div className="w-full xl:w-72 shrink-0 space-y-4">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 px-1">
              Documentos del Proveedor
            </h3>
            
            <div className="space-y-1.5">
              {selectedProvider.gtis.map((gti) => {
                const isGtiSelected = !showJsonSpecs && selectedGti.id === gti.id;
                const isPending = gti.status === 'pending';
                
                return (
                  <button
                    key={gti.id}
                    onClick={() => handleGtiSelect(gti)}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition duration-200 border flex items-center justify-between ${
                      isGtiSelected
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-white shadow-md'
                        : 'bg-transparent border-transparent hover:bg-slate-950 hover:border-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate pr-2">📄 {gti.name}</span>
                    {isPending && (
                      <span className="shrink-0 px-1.5 py-0.5 text-[8px] font-black rounded-md bg-slate-800 border border-slate-700 text-slate-400">
                        PENDIENTE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Opciones especiales para Meta */}
            {selectedProvider.id === 'meta' && (
              <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-1">
                  Herramientas y Esquemas
                </h4>
                
                {/* Botón Explorar Specs */}
                <button
                  onClick={() => setShowJsonSpecs(true)}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold transition duration-200 border flex items-center gap-2 ${
                    showJsonSpecs
                      ? 'bg-blue-600/15 border-blue-500/30 text-white shadow-md'
                      : 'bg-slate-950 border-slate-850 text-blue-400 hover:text-blue-300 hover:border-slate-800'
                  }`}
                >
                  <span>🔍</span>
                  <span>Explorar Specs JSON</span>
                </button>

                {/* Enlace descarga Postman */}
                <a
                  href="/api-toolbox/01-meta/marketing-api/MAPI-Postman-Collection.json"
                  download="MAPI-Postman-Collection.json"
                  className="w-full px-3.5 py-3 rounded-xl text-xs font-bold transition duration-200 border border-slate-850 bg-slate-950/40 hover:bg-slate-950 text-slate-300 hover:text-white flex items-center gap-2 hover:border-slate-800"
                >
                  <span>🚀</span>
                  <span>Postman Collection MAPI</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Panel Contenido Principal (Renderizado Markdown o Specs JSON) */}
        <div className="flex-1 min-w-0">
          {showJsonSpecs ? (
            <JsonSpecViewer />
          ) : (
            <GtiReader filePath={selectedGti.path} gtiName={selectedGti.name} />
          )}
        </div>

      </div>

    </div>
  );
}
