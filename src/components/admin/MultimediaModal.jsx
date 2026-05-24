import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, Image, Video, Loader2 } from 'lucide-react';
import GalleryUpload from './GalleryUpload';
import CloudSyncBadge from './CloudSyncBadge';
import { supabase } from '@/lib/customSupabaseClient';
import { imageUploadService } from '@/services/imageUploadService';

const MultimediaModal = ({ isOpen, onClose, hotelId }) => {
  const [activeTab, setActiveTab] = useState('gallery');
  const [gallery, setGallery]     = useState([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (isOpen && hotelId) loadGallery();
  }, [isOpen, hotelId]);

  useEffect(() => {
    if (!isOpen || !hotelId) return;
    const channel = supabase
      .channel(`hotel-gallery-${hotelId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'hotels_master', filter: `id=eq.${hotelId}`,
      }, () => loadGallery())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [isOpen, hotelId]);

  const loadGallery = async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hotels_master')
        .select('gallery_data')
        .eq('id', hotelId)
        .single();
      if (error) throw error;
      const raw = Array.isArray(data?.gallery_data) ? data.gallery_data : [];
      setGallery(raw.filter(item => item?.url?.startsWith('http')));
    } catch (err) {
      console.error('[MultimediaModal] Error cargando galería:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index) => {
    try {
      const deletedUrl = gallery[index]?.url;
      const updated    = gallery.filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, sort_order: i }));

      const { error } = await supabase
        .from('hotels_master')
        .update({ gallery_data: updated, updated_at: new Date().toISOString() })
        .eq('id', hotelId);

      if (error) throw error;
      if (deletedUrl) imageUploadService.deleteImage(deletedUrl);
      setGallery(updated);
    } catch (err) {
      console.error('[MultimediaModal] Error eliminando:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2">
              Gestor Multimedia
              <CloudSyncBadge tableName="hotels_master" />
            </DialogTitle>
          </div>
          <DialogDescription>
            Galería sincronizada con el sitio web público.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList>
            <TabsTrigger value="gallery" className="gap-2">
              <Image className="w-4 h-4" /> Galería ({gallery.length})
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-2">
              <Video className="w-4 h-4" /> Video Hero
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="flex-1 flex flex-col gap-4 overflow-hidden mt-4">
            <GalleryUpload hotelId={hotelId} onUploadComplete={loadGallery} />

            <div className="flex-1 border rounded-md bg-slate-50 relative overflow-hidden">
              <ScrollArea className="h-full w-full p-4">
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                ) : gallery.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                    <Image className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">No hay imágenes en la galería</p>
                    <p className="text-xs opacity-60 mt-1">Sube fotos usando el área de arriba</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {gallery.map((item, index) => (
                      <div key={index} className="group relative aspect-square bg-white rounded-lg border overflow-hidden shadow-sm">
                        <img
                          src={item.url}
                          alt={item.title || `Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        {item.scope === 'hero' && (
                          <span className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-1 rounded">HERO</span>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="video" className="flex-1 mt-4">
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Video className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">Sección Video Hero — próximamente</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MultimediaModal;
