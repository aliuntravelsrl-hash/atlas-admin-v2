
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { UploadCloud as CloudUpload, Trash2, Edit2, Plus, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { imageUploadService } from '@/services/imageUploadService';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';

const GalleryUpload = ({ hotelId, onUploadComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFiles = async (files) => {
    if (!hotelId) return;

    setUploading(true);
    setProgress(0);
    let successCount = 0;
    const totalFiles = files.length;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        
        // 1. Upload to Storage
        const url = await imageUploadService.uploadImage(file, hotelId, 'gallery');
        
        // 2. Insert into hotel_media table (SSOT)
        const { error: dbError } = await supabase.from('hotel_media').insert([{
            hotel_id: hotelId,
            scope: 'gallery',
            public_url: url,
            storage_path: url.split('/').pop(),
            title: file.name,
            sort_order: 99,
            is_active: true
        }]);

        if (dbError) {
            console.error('DB Insert Error:', dbError);
        } else {
            successCount++;
            onUploadComplete(url);
        }

        // Update progress
        setProgress(Math.round(((i + 1) / totalFiles) * 100));
      }
      
      toast({
        title: "Carga Completada",
        description: `${successCount} de ${totalFiles} imágenes subidas correctamente.`,
        className: "bg-green-50 border-green-200"
      });

    } catch (error) {
      console.error(error);
      toast({
        title: "Error de Carga",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <Card className={cn(
        "border-2 border-dashed transition-colors duration-200", 
        dragActive ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50/50"
    )}>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center cursor-pointer"
        onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
        onClick={() => document.getElementById('gallery-input').click()}
      >
        <input 
            id="gallery-input" 
            type="file" 
            multiple 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
        />
        
        <div className="bg-white p-3 rounded-full shadow-sm mb-4">
            {uploading ? (
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            ) : (
                <CloudUpload className="w-8 h-8 text-slate-400" />
            )}
        </div>
        
        <h3 className="text-sm font-semibold text-slate-900">
            {uploading ? "Subiendo imágenes..." : "Arrastra imágenes o haz clic para subir"}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
            Soporta JPG, PNG, WebP (Max 10MB)
        </p>

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
