
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Video, CheckCircle, AlertCircle, Loader2, Link as LinkIcon, Save, X } from 'lucide-react';
import { imageUploadService } from '@/services/imageUploadService';
import { hotelService } from '@/services/hotelService';

const VideoUpload = ({ hotelId, currentVideoId, currentVideoUrl, onUploadComplete, onError }) => {
  const [mode, setMode] = useState('url'); // 'url' or 'file'
  const [inputValue, setInputValue] = useState(currentVideoUrl || '');
  const [videoIdInput, setVideoIdInput] = useState(currentVideoId || '');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUrlSave = async () => {
      // 1. Text Extraction (Loose validation as requested)
      // Allow any text for video_id.
      let vidId = videoIdInput.trim();
      let vidUrl = inputValue.trim();
      
      // Basic extraction if ID is empty but URL is provided (convenience)
      if (!vidId && vidUrl) {
          if (vidUrl.includes('youtube.com') || vidUrl.includes('youtu.be')) {
              const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
              const match = vidUrl.match(regExp);
              if (match && match[2].length === 11) {
                  vidId = match[2];
              }
          }
      }

      if (!vidId && !vidUrl) {
          toast({ title: "Error", description: "Ingresa un ID o URL.", variant: "destructive" });
          return;
      }

      setUploading(true);
      try {
          await hotelService.updateHotelMultimedia(hotelId, {
              video_id: vidId,
              video_url: vidUrl
          });

          console.log(`[VideoUpload] Video guardado: ${vidId || vidUrl}`);
          if (onUploadComplete) onUploadComplete({ video_id: vidId, video_url: vidUrl });
          toast({ title: "Éxito", description: "Referencia de video guardada." });

      } catch (error) {
          console.error(error);
          if (onError) onError(error);
          toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
          setUploading(false);
      }
  };

  const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!hotelId) {
          toast({ title: "Error", description: "Falta ID del hotel", variant: "destructive" });
          return;
      }

      if (file.size > 100 * 1024 * 1024) {
          toast({ title: "Error", description: "El video excede 100MB", variant: "destructive" });
          return;
      }

      setUploading(true);
      try {
         const url = await imageUploadService.uploadImage(file, hotelId, 'videos');
         
         // Also update metadata for file uploads
         await hotelService.updateHotelMultimedia(hotelId, { video_url: url });
         
         if (onUploadComplete) onUploadComplete({ video_url: url });
         toast({ title: "Video subido", description: "El video se ha cargado correctamente." });
      } catch (err) {
         console.error(err);
         if (onError) onError(err);
         toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
         setUploading(false);
      }
  };

  return (
    <Card className="bg-slate-50/50">
        <CardContent className="p-6 space-y-4">
            <div className="flex gap-4 mb-4">
                <Button 
                    variant={mode === 'url' ? 'default' : 'outline'} 
                    onClick={() => setMode('url')}
                    size="sm"
                >
                    <LinkIcon className="w-4 h-4 mr-2" /> URL Externa / ID
                </Button>
                <Button 
                    variant={mode === 'file' ? 'default' : 'outline'} 
                    onClick={() => setMode('file')}
                    size="sm"
                >
                    <Video className="w-4 h-4 mr-2" /> Subir Archivo
                </Button>
            </div>

            {mode === 'url' ? (
                <div className="space-y-3">
                    <div className="grid gap-2">
                        <Label>YouTube/Vimeo URL</Label>
                        <Input 
                            value={inputValue} 
                            onChange={(e) => setInputValue(e.target.value)} 
                            placeholder="https://www.youtube.com/watch?v=..." 
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Video ID (Texto plano, ej: dQw4w9WgXcQ)</Label>
                        <Input 
                            value={videoIdInput} 
                            onChange={(e) => setVideoIdInput(e.target.value)} 
                            placeholder="Ej: dQw4w9WgXcQ" 
                        />
                    </div>
                    <Button onClick={handleUrlSave} disabled={uploading} className="w-full">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
                        Guardar Referencia
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <Label>Seleccionar Video (MP4, WebM)</Label>
                    <Input 
                        type="file" 
                        accept="video/mp4,video/webm" 
                        onChange={handleFileUpload} 
                        disabled={uploading} 
                    />
                    {uploading && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Loader2 className="w-4 h-4 animate-spin" /> Subiendo video...
                        </div>
                    )}
                </div>
            )}
        </CardContent>
    </Card>
  );
};

export default VideoUpload;
