import React from 'react';
import ImageUpload from '@/components/ui/ImageUpload';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';

/**
 * Componente especializado para Admin Panel
 * Permite subir fotos al bucket 'hotel-media' y proporciona herramientas de gestión.
 */
const MediaUploader = ({ 
    value, 
    onChange, 
    label = "Imagen", 
    folderPath = "hotels/general",
    aspectRatio = "aspect-video" 
}) => {
    const { toast } = useToast();

    const handleCopyUrl = () => {
        if (value) {
            navigator.clipboard.writeText(value);
            toast({ title: "Copiado", description: "URL de la imagen copiada al portapapeles." });
        }
    };

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <Label className="text-sm font-semibold text-slate-700">{label}</Label>
                    {value && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleCopyUrl} 
                            className="h-6 text-xs text-slate-400 hover:text-blue-600"
                            title="Copiar URL"
                        >
                            <Copy className="w-3 h-3 mr-1" /> URL
                        </Button>
                    )}
                </div>

                <div className={`relative bg-slate-50 rounded-lg overflow-hidden border border-slate-200 ${aspectRatio}`}>
                    <ImageUpload 
                        value={value} 
                        onChange={onChange}
                        folderPath={folderPath}
                        className="w-full h-full"
                    />
                    {!value && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                            <ImageIcon className="w-12 h-12 text-slate-400" />
                        </div>
                    )}
                </div>
                
                {value && (
                    <div className="text-xs font-mono text-slate-400 truncate bg-slate-100 p-1 rounded">
                        {value}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MediaUploader;