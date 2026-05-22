import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadCloud, Link as LinkIcon, Trash2, Image as ImageIcon, CheckCircle, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const AdminExcursionGallerySection = ({ galleryUrls = [], coverImage, onGalleryChange, onCoverChange }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [urlInput, setUrlInput] = useState('');

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const newUrls = [];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
                const filePath = `excursions/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('hotel-media')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Upload Error:', uploadError);
                    throw uploadError;
                }

                const { data } = supabase.storage
                    .from('hotel-media')
                    .getPublicUrl(filePath);

                if (data?.publicUrl) {
                    newUrls.push(data.publicUrl);
                }
            }

            if (newUrls.length > 0) {
                onGalleryChange([...galleryUrls, ...newUrls]);
                toast({
                    title: "Éxito",
                    description: `${newUrls.length} imágenes subidas correctamente.`,
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Hubo un error al subir las imágenes. " + error.message,
                variant: "destructive"
            });
        } finally {
            setUploading(false);
            e.target.value = null; 
        }
    };

    const handleUrlPaste = () => {
        if (!urlInput.trim()) return;

        const urls = urlInput
            .split('\n')
            .map(url => url.trim())
            .filter(url => url.length > 0 && (url.startsWith('http') || url.startsWith('https')));

        if (urls.length > 0) {
            onGalleryChange([...galleryUrls, ...urls]);
            setUrlInput('');
            toast({
                title: "Éxito",
                description: `${urls.length} URLs añadidas a la galería.`,
            });
        }
    };

    const removeImage = (indexToRemove) => {
        const newGallery = galleryUrls.filter((_, idx) => idx !== indexToRemove);
        onGalleryChange(newGallery);
        
        // If we removed the cover image, reset it or set to first available
        if (galleryUrls[indexToRemove] === coverImage) {
             onCoverChange(newGallery.length > 0 ? newGallery[0] : '');
        }
    };

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    {t('admin.excursions.gallery')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="upload" className="flex gap-2 items-center">
                            <UploadCloud className="w-4 h-4" />
                            {t('admin.excursions.upload_photos')}
                        </TabsTrigger>
                        <TabsTrigger value="urls" className="flex gap-2 items-center">
                            <LinkIcon className="w-4 h-4" />
                            {t('admin.excursions.paste_urls')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            <div className="flex flex-col items-center gap-2">
                                <UploadCloud className={`w-12 h-12 text-gray-400 ${uploading ? 'animate-bounce' : ''}`} />
                                <span className="text-sm text-gray-600 font-medium">
                                    {uploading ? t('common.loading') : "Arrastra tus fotos aquí o haz clic para subir"}
                                </span>
                                <span className="text-xs text-gray-400">PNG, JPG, WEBP (Max 5MB)</span>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="urls">
                        <div className="space-y-4">
                            <Label>{t('admin.excursions.paste_urls')}</Label>
                            <Textarea 
                                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" 
                                rows={4}
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                            />
                            <Button onClick={handleUrlPaste} className="w-full">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Añadir URLs
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Grid Preview */}
                <div className="mt-8">
                    <h3 className="text-sm font-semibold mb-3 text-gray-700">{t('admin.excursions.preview')} ({galleryUrls.length})</h3>
                    
                    {galleryUrls.length === 0 ? (
                        <div className="text-center py-10 bg-gray-100 rounded-lg text-gray-400 text-sm">
                            No hay imágenes en la galería.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {galleryUrls.map((url, idx) => (
                                <div key={idx} className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <img 
                                        src={url} 
                                        alt={`Gallery ${idx}`} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => e.target.src = 'https://via.placeholder.com/300?text=Error'}
                                    />
                                    
                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                        <Button 
                                            size="sm" 
                                            variant={coverImage === url ? "default" : "secondary"}
                                            className={`text-xs h-8 ${coverImage === url ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                                            onClick={() => onCoverChange(url)}
                                        >
                                            {coverImage === url ? <Star className="w-3 h-3 mr-1 fill-white" /> : null}
                                            {t('admin.excursions.set_as_cover')}
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="destructive" 
                                            className="text-xs h-8"
                                            onClick={() => removeImage(idx)}
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" />
                                            {t('admin.excursions.remove')}
                                        </Button>
                                    </div>

                                    {/* Active Cover Indicator */}
                                    {coverImage === url && (
                                        <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm font-bold flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-white" />
                                            PORTADA
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default AdminExcursionGallerySection;