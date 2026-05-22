import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';
import { useToast } from '@/components/ui/use-toast';

const GallerySection = ({ galleryData = [], onChange }) => {
  const { toast } = useToast();

  const handleAddPhoto = () => {
    console.log('➕ Agregando nueva foto vacía');
    const newPhoto = { 
      title: '', 
      src: '', 
      category: 'General', 
      description: '', 
      alt: '' 
    };
    onChange([...galleryData, newPhoto]);
  };

  const handleRemovePhoto = (index) => {
    console.log('🗑️ Removiendo foto índice:', index);
    const newList = galleryData.filter((_, i) => i !== index);
    onChange(newList);
  };

  const handleUpdatePhoto = (index, field, value) => {
    // console.log(`📝 Actualizando foto [${index}] campo [${field}]:`, value); // Verbose log
    const newList = [...galleryData];
    newList[index] = { ...newList[index], [field]: value };
    onChange(newList);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Galería de Imágenes</h3>
        <Button onClick={handleAddPhoto} size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Agregar Foto
        </Button>
      </div>

      <div className="grid gap-4">
        {galleryData.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50 text-slate-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay imágenes en la galería. ¡Agrega algunas!</p>
          </div>
        )}

        {galleryData.map((item, index) => (
          <Card key={index} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Image Upload Area */}
                <div className="md:col-span-3 lg:col-span-2">
                  <div className="aspect-square bg-slate-100 rounded-md overflow-hidden relative group">
                    <ImageUpload 
                      value={item.src} 
                      onChange={(url) => handleUpdatePhoto(index, 'src', url)}
                      folderPath="hotels/gallery"
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* Form Fields */}
                <div className="md:col-span-8 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500">Título</label>
                    <Input 
                      placeholder="Ej: Vista al Mar" 
                      value={item.title || ''} 
                      onChange={(e) => handleUpdatePhoto(index, 'title', e.target.value)} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500">Categoría</label>
                    <Input 
                      placeholder="Ej: Habitaciones, Playa, Piscina" 
                      value={item.category || ''} 
                      onChange={(e) => handleUpdatePhoto(index, 'category', e.target.value)} 
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500">Descripción</label>
                    <Textarea 
                      placeholder="Descripción detallada para la web..." 
                      className="h-20 resize-none"
                      value={item.description || ''} 
                      onChange={(e) => handleUpdatePhoto(index, 'description', e.target.value)} 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500">Texto Alternativo (SEO)</label>
                    <Input 
                      placeholder="Descripción breve para accesibilidad" 
                      value={item.alt || ''} 
                      onChange={(e) => handleUpdatePhoto(index, 'alt', e.target.value)} 
                    />
                  </div>
                  
                   {/* Fallback URL Input just in case */}
                   <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500">URL Manual (Opcional)</label>
                    <Input 
                      placeholder="https://..." 
                      value={item.src || ''} 
                      onChange={(e) => handleUpdatePhoto(index, 'src', e.target.value)} 
                      className="font-mono text-xs text-gray-400"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="md:col-span-1 flex justify-end md:justify-center pt-2">
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemovePhoto(index)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    title="Eliminar Foto"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>

              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GallerySection;