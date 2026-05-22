import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { imageUploadService } from '@/services/imageUploadService';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const ImageUpload = ({ 
  value, 
  onChange, 
  hotelId,
  folderPath = 'general', 
  className,
  onUploadStart,
  onUploadEnd
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const { toast } = useToast();

  const handleFile = async (file) => {
    if (!file) return;

    if (!hotelId) {
        console.error("[ImageUpload] ❌ Missing hotelId prop. Cannot upload to n8n workflow.");
        toast({ title: 'Error de Configuración', description: 'Falta el ID del hotel para asociar la imagen.', variant: 'destructive' });
        return;
    }

    if (!file.type.startsWith('image/')) {
        toast({ title: 'Formato inválido', description: 'Solo se permiten imágenes.', variant: 'destructive' });
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Archivo muy grande', description: 'Máximo 5MB permitidos.', variant: 'destructive' });
        return;
    }

    setUploading(true);
    if(onUploadStart) onUploadStart();

    try {
        // Updated to use n8n workflow integration
        const url = await imageUploadService.uploadImage(file, hotelId, folderPath);
        onChange(url);
        toast({ title: 'Imagen subida', description: 'Procesada correctamente por el servidor.' });
    } catch (error) {
        console.error("[ImageUpload] Upload failed:", error);
        toast({ 
            title: 'Error al subir', 
            description: 'No se pudo procesar la imagen en el servidor.', 
            variant: 'destructive' 
        });
    } finally {
        setUploading(false);
        if(onUploadEnd) onUploadEnd();
    }
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleRemove = async (e) => {
      e.stopPropagation(); e.preventDefault();
      if(!value) return;
      if(window.confirm('¿Eliminar imagen?')) {
          try {
             await imageUploadService.deleteImage(value);
             onChange('');
             toast({ title: 'Imagen eliminada' });
          } catch (error) {
             onChange(''); 
          }
      }
  };

  return (
    <div className={cn("w-full h-full", className)}>
       <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={handleChange} />
       
       {!value ? (
           <div 
             className={cn(
               "h-full w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 min-h-[120px]",
               dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-100",
               uploading && "opacity-50 pointer-events-none"
             )}
             onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
             onClick={() => inputRef.current?.click()}
           >
               {uploading ? (
                   <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
               ) : (
                   <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
               )}
               <p className="text-xs text-gray-500 font-medium text-center px-2">
                   {uploading ? "Enviando a n8n..." : "Click o arrastra imagen"}
               </p>
           </div>
       ) : (
           <div className="relative group w-full h-full min-h-[120px] border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
               <img src={value} alt="Preview" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <Button variant="secondary" size="sm" className="h-8 px-2 text-xs"
                     onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                   >Cambiar</Button>
                   <Button variant="destructive" size="sm" className="h-8 w-8 p-0" onClick={handleRemove}>
                       <X className="w-4 h-4" />
                   </Button>
               </div>
           </div>
       )}
    </div>
  );
};

export default ImageUpload;