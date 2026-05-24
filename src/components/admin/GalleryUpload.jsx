import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { UploadCloud as CloudUpload, Loader2 } from 'lucide-react';
import { imageUploadService } from '@/services/imageUploadService';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';

const GalleryUpload = ({ hotelId, onUploadComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const { toast } = useToast();

  const handleFiles = async (files) => {
    if (!hotelId) {
      toast({ title: 'Error', description: 'Hotel ID no disponible.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    setProgress(0);
    let successCount = 0;
    const total = files.length;

    try {
      const { data: hotelData, error: fetchError } = await supabase
        .from('hotels_master')
        .select('gallery_data, slug, about_image')
        .eq('id', hotelId)
        .single();

      if (fetchError) throw new Error(`Hotel no encontrado: ${fetchError.message}`);

      const currentGallery = Array.isArray(hotelData.gallery_data)
        ? hotelData.gallery_data : [];
      const newEntries = [];

      for (let i = 0; i < total; i++) {
        try {
          const url = await imageUploadService.uploadImage(files[i], hotelId, 'gallery');
          newEntries.push({
            url,
            scope: 'gallery',
            sort_order: currentGallery.length + newEntries.length,
            title: `Galería ${currentGallery.length + newEntries.length + 1}: ${hotelData.slug}`,
          });
          successCount++;
        } catch (e) {
          console.error(`Error con ${files[i].name}:`, e);
        }
        setProgress(Math.round(((i + 1) / total) * 100));
      }

      if (newEntries.length === 0) throw new Error('Ninguna imagen se subió correctamente.');

      const updatedGallery = [...currentGallery, ...newEntries];
      const noAboutImage   = !hotelData.about_image || hotelData.about_image === '';

      const { error: updateError } = await supabase
        .from('hotels_master')
        .update({
          gallery_data: updatedGallery,
          ...(noAboutImage ? { about_image: newEntries[0].url } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', hotelId);

      if (updateError) throw new Error(`Error guardando: ${updateError.message}`);

      toast({
        title: 'Carga Completada ✅',
        description: `${successCount} de ${total} imágenes guardadas.`,
        className: 'bg-green-50 border-green-200',
      });

      if (onUploadComplete) onUploadComplete();

    } catch (error) {
      toast({ title: 'Error de Carga', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFiles(e.dataTransfer.files);
  };

  return (
    <Card className={cn(
      'border-2 border-dashed transition-colors duration-200',
      dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50/50'
    )}>
      <CardContent
        className="flex flex-col items-center justify-center p-8 text-center cursor-pointer"
        onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
        onClick={() => !uploading && document.getElementById('gallery-input').click()}
      >
        <input
          id="gallery-input" type="file" multiple accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
        <div className="bg-white p-3 rounded-full shadow-sm mb-4">
          {uploading
            ? <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            : <CloudUpload className="w-8 h-8 text-slate-400" />}
        </div>
        <h3 className="text-sm font-semibold text-slate-900">
          {uploading ? 'Subiendo imágenes...' : 'Arrastra imágenes o haz clic para subir'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">JPG, PNG, WebP · Max 10MB</p>
        {uploading && (
          <div className="w-full max-w-xs space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-[10px] text-slate-400 text-right">{progress}%</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GalleryUpload;
