import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminExcursionGallerySection from '@/components/admin/AdminExcursionGallerySection';

const AdminExcursionsPage = () => {
    const [excursions, setExcursions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentExcursion, setCurrentExcursion] = useState(null);
    const { toast } = useToast();
    const { t } = useTranslation();

    const fetchExcursions = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('excursions').select(`*, excursion_services(*, pricing_rules(*))`).order('created_at');
        if (error) {
            toast({ title: t('common.error'), description: "No se pudieron cargar las excursiones.", variant: "destructive" });
        } else {
            setExcursions(data);
        }
        setLoading(false);
    }, [toast, t]);

    useEffect(() => {
        fetchExcursions();
    }, [fetchExcursions]);

    const handleAddNew = () => {
        setCurrentExcursion(null);
        setIsFormOpen(true);
    };

    const handleEdit = (excursion) => {
        setCurrentExcursion(excursion);
        setIsFormOpen(true);
    };
    
    const handleDelete = async (excursionId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta excursión?")) return;
        
        const { error } = await supabase.from('excursions').delete().eq('id', excursionId);
        if (error) {
            toast({ title: t('common.error'), description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Éxito", description: "Excursión eliminada correctamente." });
            fetchExcursions();
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Gestión de Excursiones</CardTitle>
                        <CardDescription>Crea, edita y gestiona el catálogo de excursiones.</CardDescription>
                    </div>
                    <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Nueva</Button>
                </div>
            </CardHeader>
            <CardContent>
                {isFormOpen ? (
                    <ExcursionForm 
                        excursion={currentExcursion} 
                        onClose={() => setIsFormOpen(false)} 
                        onSave={() => {
                            setIsFormOpen(false);
                            fetchExcursions();
                        }}
                    />
                ) : (
                    <ExcursionList excursions={excursions} onEdit={handleEdit} onDelete={handleDelete} />
                )}
            </CardContent>
        </Card>
    );
};

const ExcursionList = ({ excursions, onEdit, onDelete }) => (
    <div className="space-y-4">
        {excursions.map(ex => (
            <div key={ex.id} className="border p-4 rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                    {ex.image_url && <img src={ex.image_url} alt={ex.name} className="w-16 h-16 rounded object-cover shadow-sm" />}
                    <div>
                        <h3 className="font-bold text-lg">{ex.name}</h3>
                        <p className="text-sm text-gray-500">{ex.location} • {ex.duration_text}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(ex)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(ex.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            </div>
        ))}
         {excursions.length === 0 && <p className="text-center text-gray-500 py-8">No hay excursiones creadas todavía.</p>}
    </div>
);


const ExcursionForm = ({ excursion, onClose, onSave }) => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Fields
    const [name, setName] = useState(excursion?.name || '');
    const [slug, setSlug] = useState(excursion?.slug || '');
    const [description, setDescription] = useState(excursion?.description || '');
    const [location, setLocation] = useState(excursion?.location || '');
    const [durationText, setDurationText] = useState(excursion?.duration_text || '');
    const [category, setCategory] = useState(excursion?.category || 'cultural');
    const [highlights, setHighlights] = useState(excursion?.highlights ? excursion.highlights.join(', ') : '');
    
    // New Fields
    const [imageUrl, setImageUrl] = useState(excursion?.image_url || '');
    const [galleryUrls, setGalleryUrls] = useState(excursion?.gallery_urls || []);
    const [priceBase, setPriceBase] = useState(excursion?.price_base_usd || '');
    const [priceHotel, setPriceHotel] = useState(excursion?.price_with_hotel_usd || '');
    const [maxCapacity, setMaxCapacity] = useState(excursion?.max_capacity || '');

    const generateSlug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    useEffect(() => {
        if (!excursion && name) { 
           setSlug(generateSlug(name));
        }
    }, [name, excursion]);

    const validateForm = () => {
        if (!name || !description || !location || !durationText) {
            toast({ title: "Validación", description: "Por favor completa todos los campos obligatorios.", variant: "destructive" });
            return false;
        }
        if (priceBase && parseFloat(priceBase) < 0) {
            toast({ title: "Validación", description: "El precio base debe ser positivo.", variant: "destructive" });
            return false;
        }
        if (priceHotel && parseFloat(priceHotel) < 0) {
             toast({ title: "Validación", description: "El precio con hotel debe ser positivo.", variant: "destructive" });
             return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        
        const highlightsArray = highlights.split(',').map(h => h.trim()).filter(h => h.length > 0);
        
        const payload = {
            name,
            slug,
            description,
            location,
            duration_text: durationText,
            category,
            highlights: highlightsArray,
            image_url: imageUrl,
            gallery_urls: galleryUrls,
            price_base_usd: priceBase || null,
            price_with_hotel_usd: priceHotel || null,
            max_capacity: maxCapacity || null
        };

        const query = excursion?.id 
            ? supabase.from('excursions').update(payload).eq('id', excursion.id)
            : supabase.from('excursions').insert([payload]);

        const { error } = await query;

        if (error) {
            toast({ title: t('common.error'), description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Éxito", description: "Excursión guardada correctamente." });
            onSave();
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">{t('admin.excursions.general_data')}</TabsTrigger>
                    <TabsTrigger value="gallery">{t('admin.excursions.gallery')}</TabsTrigger>
                    <TabsTrigger value="pricing">Precios y Detalles</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label htmlFor="name">Nombre</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} required /></div>
                        <div><Label htmlFor="slug">Slug (URL)</Label><Input id="slug" value={slug} onChange={e => setSlug(e.target.value)} required /></div>
                    </div>
                    <div><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} required /></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><Label>{t('admin.excursions.location')}</Label><Input value={location} onChange={e => setLocation(e.target.value)} required /></div>
                        <div><Label>{t('admin.excursions.duration')}</Label><Input value={durationText} onChange={e => setDurationText(e.target.value)} required placeholder="Ej: 4 Horas" /></div>
                        <div>
                            <Label>{t('admin.excursions.category')}</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cultural">Cultural</SelectItem>
                                    <SelectItem value="water">Agua</SelectItem>
                                    <SelectItem value="extreme">Extremo</SelectItem>
                                    <SelectItem value="buggies">Buggies</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div><Label>{t('admin.excursions.highlights')}</Label><Input value={highlights} onChange={e => setHighlights(e.target.value)} placeholder="Ej: Transporte, Bebidas, Guía" /></div>
                </TabsContent>

                <TabsContent value="gallery" className="pt-4">
                    <AdminExcursionGallerySection 
                        galleryUrls={galleryUrls} 
                        coverImage={imageUrl}
                        onGalleryChange={setGalleryUrls}
                        onCoverChange={setImageUrl}
                    />
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-lg bg-gray-50">
                        <div><Label>{t('admin.excursions.price_base')}</Label><Input type="number" step="0.01" value={priceBase} onChange={e => setPriceBase(e.target.value)} placeholder="0.00" /></div>
                        <div><Label>{t('admin.excursions.price_with_hotel')}</Label><Input type="number" step="0.01" value={priceHotel} onChange={e => setPriceHotel(e.target.value)} placeholder="0.00" /></div>
                        <div><Label>{t('admin.excursions.max_capacity')}</Label><Input type="number" value={maxCapacity} onChange={e => setMaxCapacity(e.target.value)} placeholder="50" /></div>
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                    <X className="w-4 h-4 mr-2" />
                    {t('admin.excursions.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
                    {t('admin.excursions.save')}
                </Button>
            </div>
        </form>
    );
};

export default AdminExcursionsPage;