import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, UploadCloud, Trash2, Image as ImageIcon, Link } from 'lucide-react';

/**
 * HotelMultimediaTab v2 — flujo directo sin dependencias rotas
 * Upload → Storage hotel-media → guarda en hotels_master.gallery_data
 * Soporta URL manual como fallback.
 */
const HotelMultimediaTab = ({ hotelId, hotelName }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [gallery, setGallery]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  // ── Carga galería existente ───────────────────────────────────
  useEffect(() => {
    if (!hotelId) return;
    const fetchGallery = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('hotels_master')
        .select('gallery_data, gallery')
        .eq('id', hotelId)
        .single();
      if (!error && data) {
        // gallery_data = jsonb (nuevo), gallery = text[] (legacy)
        if (Array.isArray(data.gallery_data) && data.gallery_data.length > 0) {
          setGallery(data.gallery_data);
        } else if (Array.isArray(data.gallery) && data.gallery.length > 0) {
          // migrar gallery[] a gallery_data format
          setGallery(data.gallery.map((url, i) => ({ url, title: `Foto ${i+1}`, sort_order: i })));
        }
      }
      setLoading(false);
    };
    fetchGallery();
  }, [hotelId]);

  // ── Subir archivos a Storage ──────────────────────────────────
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !hotelId) return;

    setUploading(true);
    const newItems = [];

    for (const file of files) {
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10*1024*1024) {
        toast({ title: 'Archivo ignorado', description: `${file.name} no es válido o supera 10MB`, variant: 'destructive' });
        continue;
      }
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g,'_')}`;
      const filePath = `hotels/${hotelId}/gallery/${safeName}`;

      const { error: upErr } = await supabase.storage
        .from('hotel-media')
        .upload(filePath, file, { upsert: true });

      if (upErr) {
        toast({ title: 'Error subiendo', description: upErr.message, variant: 'destructive' });
        continue;
      }
      const { data: { publicUrl } } = supabase.storage.from('hotel-media').getPublicUrl(filePath);
      newItems.push({ url: publicUrl, title: file.name.split('.')[0], sort_order: gallery.length + newItems.length });
    }

    if (newItems.length) {
      setGallery(prev => [...prev, ...newItems]);
      toast({ title: `✅ ${newItems.length} foto(s) subida(s)`, description: 'Presiona Guardar Galería para confirmar.' });
    }
    setUploading(false);
    e.target.value = null;
  };

  // ── Agregar URL manual ────────────────────────────────────────
  const handleAddUrl = () => {
    const url = manualUrl.trim();
    if (!url.startsWith('http')) {
      toast({ title: 'URL inválida', description: 'Debe comenzar con http/https', variant: 'destructive' });
      return;
    }
    setGallery(prev => [...prev, { url, title: `Foto ${prev.length+1}`, sort_order: prev.length }]);
    setManualUrl('');
  };

  // ── Eliminar foto ─────────────────────────────────────────────
  const handleRemove = (idx) => {
    setGallery(prev => prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, sort_order: i })));
  };

  // ── Guardar en Supabase ───────────────────────────────────────
  const handleSave = async () => {
    if (!hotelId) return;
    setSaving(true);
    const { error } = await supabase
      .from('hotels_master')
      .update({
        gallery_data: gallery,
        gallery: gallery.map(item => item.url), // mantener campo legacy sincronizado
        about_image: gallery[0]?.url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', hotelId);

    if (error) {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Galería guardada', description: `${gallery.length} foto(s) en ${hotelName || 'el hotel'}.`, className: 'bg-green-50 text-green-800 border-green-200' });
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header con botón guardar */}
      <div className="flex justify-between items-center bg-slate-50 border rounded-lg p-4">
        <div>
          <p className="font-bold text-slate-800">🖼️ Galería de Imágenes</p>
          <p className="text-xs text-slate-500">{gallery.length} foto(s) · Mínimo recomendado: 8</p>
        </div>
        <Button onClick={handleSave} disabled={saving || gallery.length === 0}
          className="bg-green-700 hover:bg-green-600 text-white font-bold">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Guardando...</> : <><UploadCloud className="w-4 h-4 mr-2"/>Guardar Galería</>}
        </Button>
      </div>

      {/* Upload zona */}
      <div
        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-yellow-500 hover:bg-yellow-50 transition-all"
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp"
          className="hidden" onChange={handleFiles} />
        {uploading
          ? <><Loader2 className="w-8 h-8 animate-spin mx-auto text-yellow-600 mb-2"/><p className="text-sm text-yellow-700 font-medium">Subiendo fotos...</p></>
          : <><ImageIcon className="w-10 h-10 mx-auto text-slate-400 mb-3"/>
              <p className="font-semibold text-slate-600">Click o arrastra imágenes aquí</p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP · máx 10MB por foto</p></>
        }
      </div>

      {/* URL Manual */}
      <div className="flex gap-2">
        <Input
          value={manualUrl}
          onChange={e => setManualUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
          placeholder="URL Manual (https://...)  — presiona Enter o el botón"
          className="text-sm"
        />
        <Button variant="outline" onClick={handleAddUrl} className="shrink-0">
          <Link className="w-4 h-4 mr-1"/>Agregar
        </Button>
      </div>

      {/* Grid de fotos */}
      {gallery.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {gallery.map((item, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100">
              <img
                src={item.url}
                alt={item.title || `Foto ${idx+1}`}
                className="w-full h-full object-cover"
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
              />
              <div className="absolute inset-0 hidden items-center justify-center bg-slate-200 text-xs text-slate-500 p-2 text-center">
                <ImageIcon className="w-6 h-6 text-slate-400"/>
              </div>
              {idx === 0 && (
                <span className="absolute top-1 left-1 bg-yellow-600 text-white text-xs px-2 py-0.5 rounded font-bold">Portada</span>
              )}
              <button
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3"/>
              </button>
            </div>
          ))}
        </div>
      )}

      {gallery.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-4">Sin fotos aún. Sube imágenes o agrega URLs manuales.</p>
      )}

      {/* Botón guardar al final también */}
      {gallery.length > 0 && (
        <Button onClick={handleSave} disabled={saving} className="w-full bg-green-700 hover:bg-green-600 text-white font-bold h-12">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Guardando...</> : <><UploadCloud className="w-4 h-4 mr-2"/>Guardar {gallery.length} Foto(s)</>}
        </Button>
      )}
    </div>
  );
};

export default HotelMultimediaTab;
