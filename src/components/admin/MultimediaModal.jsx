
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, Upload, Image, Video, AlertCircle, Loader2, Check } from 'lucide-react';
import GalleryUpload from './GalleryUpload';
import CloudSyncBadge from './CloudSyncBadge';
import { HotelDataService } from '@/services/HotelDataService';
import { supabase } from '@/lib/customSupabaseClient';

const MultimediaModal = ({ isOpen, onClose, hotelId }) => {
  const [activeTab, setActiveTab] = useState('gallery');
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initial Load
  useEffect(() => {
    if (isOpen && hotelId) {
        loadMedia();
    }
  }, [isOpen, hotelId]);

  // Realtime Subscription
  useEffect(() => {
    if (!isOpen || !hotelId) return;

    const subscription = supabase
        .channel(`media-${hotelId}`)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'hotel_media', 
            filter: `hotel_id=eq.${hotelId}` 
        }, (payload) => {
            console.log('Realtime Media Update:', payload);
            loadMedia(); // Refresh on any change
        })
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
  }, [isOpen, hotelId]);

  const loadMedia = async () => {
      setLoading(true);
      try {
          // Fetch from hotel_media table directly for SSOT
          const { data, error } = await supabase
              .from('hotel_media')
              .select('*')
              .eq('hotel_id', hotelId)
              .eq('scope', 'gallery')
              .eq('is_active', true)
              .order('sort_order', { ascending: true });
              
          if (error) throw error;
          setGallery(data || []);
      } catch (error) {
          console.error("Failed to load media:", error);
      } finally {
          setLoading(false);
      }
  };

  const handleDelete = async (mediaId) => {
      const { error } = await supabase
          .from('hotel_media')
          .update({ is_active: false }) // Soft delete
          .eq('id', mediaId);
      
      if (!error) {
          setGallery(prev => prev.filter(item => item.id !== mediaId));
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2">
                Gestor Multimedia
                <CloudSyncBadge tableName="hotel_media" />
            </DialogTitle>
          </div>
          <DialogDescription>
            Administra galería y videos. Los cambios se sincronizan automáticamente.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList>
                <TabsTrigger value="gallery" className="gap-2"><Image className="w-4 h-4"/> Galería</TabsTrigger>
                <TabsTrigger value="video" className="gap-2"><Video className="w-4 h-4"/> Video Hero</TabsTrigger>
            </TabsList>

            <TabsContent value="gallery" className="flex-1 flex flex-col gap-4 overflow-hidden mt-4">
                <GalleryUpload hotelId={hotelId} onUploadComplete={() => loadMedia()} />
                
                <div className="flex-1 border rounded-md bg-slate-50 relative overflow-hidden">
                    <ScrollArea className="h-full w-full p-4">
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-400"/></div>
                        ) : gallery.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                <Image className="w-12 h-12 mb-2 opacity-20"/>
                                <p>No hay imágenes activas</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {gallery.map((item) => (
                                    <div key={item.id} className="group relative aspect-square bg-white rounded-lg border overflow-hidden shadow-sm">
                                        <img src={item.public_url} alt={item.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                                                <X className="w-4 h-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </TabsContent>

            <TabsContent value="video">
                <div className="flex items-center justify-center h-64 bg-slate-50 border rounded-md text-slate-400">
                    <p>Módulo de Video en desarrollo...</p>
                </div>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MultimediaModal;
