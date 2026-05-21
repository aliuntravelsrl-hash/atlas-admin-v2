import { useState, useEffect } from 'react';
import { marked } from 'marked';

export default function GtiReader({ filePath, gtiName }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!filePath) return;

    setLoading(true);
    setError(null);

    // Cargar el archivo markdown usando fetch
    fetch(filePath)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`No se pudo cargar el archivo: ${res.statusText}`);
        }
        return res.text();
      })
      .then((text) => {
        // Parsear markdown a HTML
        const html = marked.parse(text);
        setContent(html);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando GTI:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [filePath]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <svg className="animate-spin h-10 w-10 text-emerald-500 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="font-semibold text-sm">Cargando documentación...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center text-rose-400">
        <svg className="mx-auto h-12 w-12 text-rose-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h4 className="font-bold text-lg mb-1">Error al cargar el documento</h4>
        <p className="text-sm opacity-90">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl">
      {/* Estilos específicos inyectados para el renderizado del markdown */}
      <style>{`
        .gti-content h1 {
          font-size: 2.25rem;
          font-weight: 800;
          color: #ffffff;
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(51, 65, 85, 0.5);
          padding-bottom: 0.5rem;
          letter-spacing: -0.025em;
        }
        .gti-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f1f5f9;
          margin-top: 2rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(51, 65, 85, 0.3);
          padding-bottom: 0.35rem;
          letter-spacing: -0.02em;
        }
        .gti-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #e2e8f0;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .gti-content p {
          color: #cbd5e1;
          line-height: 1.75;
          margin-bottom: 1.25rem;
          font-size: 0.975rem;
        }
        .gti-content a {
          color: #10b981;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .gti-content a:hover {
          color: #34d399;
          text-decoration: underline;
        }
        .gti-content ul, .gti-content ol {
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
          color: #cbd5e1;
        }
        .gti-content ul {
          list-style-type: disc;
        }
        .gti-content ol {
          list-style-type: decimal;
        }
        .gti-content li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        .gti-content pre {
          background-color: #020617;
          border: 1px solid rgba(51, 65, 85, 0.4);
          border-radius: 0.75rem;
          padding: 1.25rem;
          overflow-x: auto;
          margin-bottom: 1.5rem;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .gti-content code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.875rem;
          color: #a7f3d0;
          background-color: rgba(16, 185, 129, 0.1);
          padding: 0.125rem 0.35rem;
          border-radius: 0.25rem;
        }
        .gti-content pre code {
          background-color: transparent;
          padding: 0;
          color: #e2e8f0;
          border-radius: 0;
          font-size: 0.85rem;
          line-height: 1.5;
        }
        .gti-content blockquote {
          border-left: 4px solid #10b981;
          background-color: rgba(16, 185, 129, 0.04);
          padding: 1rem 1.25rem;
          margin-bottom: 1.5rem;
          border-radius: 0 0.5rem 0.5rem 0;
          font-style: italic;
        }
        .gti-content blockquote p {
          margin-bottom: 0;
          color: #94a3b8;
        }
        .gti-content table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.75rem;
          font-size: 0.9rem;
          text-align: left;
          background-color: rgba(2, 6, 23, 0.2);
          border-radius: 0.75rem;
          overflow: hidden;
          border: 1px solid rgba(51, 65, 85, 0.4);
        }
        .gti-content th {
          background-color: rgba(15, 23, 42, 0.8);
          color: #f8fafc;
          font-weight: 700;
          padding: 0.85rem 1rem;
          border-bottom: 1px solid rgba(51, 65, 85, 0.6);
        }
        .gti-content td {
          padding: 0.85rem 1rem;
          color: #cbd5e1;
          border-bottom: 1px solid rgba(51, 65, 85, 0.2);
        }
        .gti-content tr:last-child td {
          border-bottom: none;
        }
        .gti-content tr:nth-child(even) {
          background-color: rgba(30, 41, 59, 0.25);
        }
        .gti-content hr {
          border: 0;
          border-top: 1px solid rgba(51, 65, 85, 0.5);
          margin: 2rem 0;
        }
        .gti-content strong {
          color: #ffffff;
          font-weight: 700;
        }
      `}</style>

      {/* Cabecera del documento */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-6">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">
            Documento Técnico GTI
          </span>
          <h2 className="text-xl font-bold text-white mt-0.5">{gtiName}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Copiar el contenido del archivo al portapapeles
              navigator.clipboard.writeText(content.replace(/<[^>]*>/g, ''));
              alert('Texto plano copiado al portapapeles');
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition border border-slate-700/50"
          >
            📋 Copiar texto
          </button>
          <a
            href={filePath}
            download
            className="px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition border border-emerald-500/20"
          >
            ⬇️ Descargar .md
          </a>
        </div>
      </div>

      {/* Renderizado del HTML generado */}
      <div
        className="gti-content select-text selection:bg-emerald-500/20"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
