
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { multimediaService } from '@/services/multimediaService';

const RoomImageUpload = ({ hotelId, roomId, onImageUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const { toast } = useToast();

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Local Preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    try {
      if (!hotelId) throw new Error("Hotel ID missing for upload");
      
      const publicUrl = await multimediaService.uploadRoomImage(hotelId, roomId, file);
      
      onImageUpload(publicUrl);
      setPreview(null); // Clear preview after success
      toast({ title: "Imagen subida", description: "La imagen se ha cargado correctamente." });

    } catch (error) {
      console.error(error);
      toast({ 
        title: "Error de subida", 
        description: error.message, 
        variant: "destructive" 
      });
      setPreview(null);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = null;
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          id={`upload-${roomId}`}
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <Label 
          htmlFor={`upload-${roomId}`} 
          className={`flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Subiendo...' : 'Subir Foto'}
        </Label>
      </div>

      {preview && (
        <div className="relative w-10 h-10 rounded overflow-hidden border">
           <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-50" />
           <Loader2 className="absolute inset-0 m-auto w-4 h-4 animate-spin text-slate-800" />
        </div>
      )}
    </div>
  );
};

export default RoomImageUpload;
