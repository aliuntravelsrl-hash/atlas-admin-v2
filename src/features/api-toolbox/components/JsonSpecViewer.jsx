import { useState, useEffect } from 'react';

const AVAILABLE_SPECS = [
  { id: 'AdAccount', displayName: 'AdAccount' },
  { id: 'AdAccountTargetingUnified', displayName: 'AdAccountTargetingUnified' },
  { id: 'AdCampaign', displayName: 'AdCampaign' },
  { id: 'AdCampaignGroup', displayName: 'AdCampaignGroup' },
  { id: 'AdCreative', displayName: 'AdCreative' },
  { id: 'AdSet', displayName: 'AdSet' },
  { id: 'AdsPixel', displayName: 'AdsPixel' },
  { id: 'CustomAudience', displayName: 'CustomAudience' },
  { id: 'InstagramUser', displayName: 'InstagramUser' },
  { id: 'Lead', displayName: 'Lead' },
  { id: 'LeadgenForm', displayName: 'LeadgenForm' },
  { id: 'ProductCatalog', displayName: 'ProductCatalog' }
];

export default function JsonSpecViewer() {
  const [selectedSpec, setSelectedSpec] = useState(AVAILABLE_SPECS[0]);
  const [specData, setSpecData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('fields'); // 'fields' | 'apis'

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSearchTerm('');

    const specPath = `/api-toolbox/01-meta/marketing-api/specs/${selectedSpec.id}.json`;

    fetch(specPath)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error al cargar el archivo de especificación ${selectedSpec.displayName}`);
        }
        return res.json();
      })
      .then((data) => {
        setSpecData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando spec:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [selectedSpec]);

  // Filtrar campos basados en el buscador
  const filteredFields = specData?.fields?.filter((field) =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Filtrar endpoints basados en el buscador
  const filteredApis = specData?.apis?.filter((api) => {
    const endpointStr = api.endpoint || api.name || '';
    const methodStr = api.method || '';
    const returnStr = api.return || '';
    return (
      endpointStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      methodStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnStr.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  // Renderizador de color de badge para tipos
  const getTypeBadgeColor = (type) => {
    const t = type.toLowerCase();
    if (t.includes('string')) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    if (t.includes('bool') || t.includes('boolean')) return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    if (t.includes('int') || t.includes('number') || t.includes('float')) return 'bg-sky-500/10 border-sky-500/30 text-sky-400';
    if (t.includes('list') || t.includes('array')) return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
    if (t.includes('map') || t.includes('object')) return 'bg-violet-500/10 border-violet-500/30 text-violet-400';
    return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
  };

  // Renderizador de color de badge para métodos HTTP
  const getMethodBadgeColor = (method) => {
    const m = method.toUpperCase();
    if (m === 'GET') return 'bg-emerald-500 text-slate-950 font-black';
    if (m === 'POST') return 'bg-blue-500 text-white font-black';
    if (m === 'DELETE') return 'bg-rose-500 text-white font-black';
    if (m === 'PUT') return 'bg-amber-500 text-slate-950 font-black';
    return 'bg-slate-500 text-white font-black';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl min-h-[600px]">
      
      {/* Menú Lateral: Lista de Specs */}
      <div className="w-full lg:w-64 flex flex-col shrink-0 border-b lg:border-b-0 lg:border-r border-slate-850 pb-6 lg:pb-0 lg:pr-6">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 px-2">
          Especificaciones JSON
        </h3>
        <div className="space-y-1 overflow-y-auto max-h-[300px] lg:max-h-[550px] pr-1 scrollbar-thin">
          {AVAILABLE_SPECS.map((spec) => (
            <button
              key={spec.id}
              onClick={() => setSelectedSpec(spec)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition border ${
                selectedSpec.id === spec.id
                  ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-md'
                  : 'bg-transparent border-transparent hover:bg-slate-950 hover:border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
            >
              📄 {spec.displayName}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Encabezado y buscador */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-5 mb-5">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-blue-400">
              Esquema Seleccionado
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
              {selectedSpec.displayName}.json
            </h2>
          </div>
          
          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              🔍
            </span>
            <input
              type="text"
              placeholder={`Buscar en ${activeTab === 'fields' ? 'campos' : 'endpoints'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
            />
          </div>
        </div>

        {/* Carga / Error */}
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20 text-slate-400">
            <svg className="animate-spin h-8 w-8 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-semibold">Cargando especificaciones...</span>
          </div>
        ) : error ? (
          <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-center text-rose-400 my-auto">
            <p className="font-bold text-sm">No se pudo cargar la especificación</p>
            <p className="text-xs opacity-80 mt-1">{error}</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            
            {/* Pestañas (Tabs) */}
            <div className="flex gap-2 border-b border-slate-850 pb-3 mb-4">
              <button
                onClick={() => {
                  setActiveTab('fields');
                  setSearchTerm('');
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeTab === 'fields'
                    ? 'bg-slate-950 border border-slate-800 text-white font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🗂️ Campos del Esquema ({specData?.fields?.length || 0})
              </button>
              <button
                onClick={() => {
                  setActiveTab('apis');
                  setSearchTerm('');
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeTab === 'apis'
                    ? 'bg-slate-950 border border-slate-800 text-white font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🔌 Endpoints API ({specData?.apis?.length || 0})
              </button>
            </div>

            {/* Renderizado de Pestaña Campos */}
            {activeTab === 'fields' && (
              <div className="flex-1 overflow-x-auto">
                {filteredFields.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs font-semibold">
                    No se encontraron campos que coincidan con la búsqueda.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80">
                        <th className="py-3 px-4 text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-950/40 rounded-l-xl">
                          Campo
                        </th>
                        <th className="py-3 px-4 text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-950/40 rounded-r-xl">
                          Tipo de Dato
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {filteredFields.map((field, idx) => (
                        <tr key={idx} className="hover:bg-slate-950/20 transition-all">
                          <td className="py-3 px-4 font-mono text-xs font-extrabold text-white select-all">
                            {field.name}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md border ${getTypeBadgeColor(field.type)}`}>
                              {field.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Renderizado de Pestaña Endpoints API */}
            {activeTab === 'apis' && (
              <div className="flex-1 space-y-4">
                {filteredApis.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs font-semibold">
                    No se encontraron endpoints que coincidan con la búsqueda o no están definidos.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredApis.map((api, idx) => {
                      const endpointName = api.endpoint || api.name || '';
                      const isNameAction = endpointName.startsWith('#');
                      return (
                        <div
                          key={idx}
                          className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 hover:border-slate-800 transition-all flex flex-col gap-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className={`px-2.5 py-0.5 text-[10px] rounded font-extrabold tracking-wider ${getMethodBadgeColor(api.method)}`}>
                                {api.method}
                              </span>
                              <span className="font-mono text-xs font-black text-slate-200 select-all">
                                {isNameAction ? (
                                  <span className="text-slate-500 italic">Acción: {endpointName}</span>
                                ) : (
                                  endpointName
                                )}
                              </span>
                            </div>
                            {api.return && (
                              <div className="text-[10px] font-semibold text-slate-400">
                                Retorna:{' '}
                                <span className="font-mono text-blue-400 select-all font-bold">
                                  {api.return}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Parámetros del Endpoint */}
                          {api.params && api.params.length > 0 ? (
                            <div className="mt-1 border-t border-slate-900 pt-3">
                              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                                Parámetros ({api.params.length})
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {api.params.map((param, pidx) => (
                                  <div
                                    key={pidx}
                                    className="bg-slate-900/30 border border-slate-850/60 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-slate-300 select-all">
                                        {param.name}
                                      </span>
                                      {param.required && (
                                        <span className="text-[8px] font-black bg-rose-600/20 text-rose-400 px-1 border border-rose-500/20 rounded">
                                          REQUERIDO
                                        </span>
                                      )}
                                    </div>
                                    <span className={`px-1.5 py-0.2 text-[9px] font-mono rounded border ${getTypeBadgeColor(param.type)}`}>
                                      {param.type}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[9px] text-slate-600 font-semibold italic border-t border-slate-900/40 pt-2">
                              Sin parámetros requeridos
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
