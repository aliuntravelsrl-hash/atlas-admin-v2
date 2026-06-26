import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, Save, X, ListTodo } from 'lucide-react';
import AdminExcursionGallerySection from '@/components/admin/AdminExcursionGallerySection';

const AdminExcursionsPage = () => {
    const [excursions, setExcursions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('list'); // 'list', 'edit', 'plans'
    const [currentExcursion, setCurrentExcursion] = useState(null);
    const { toast } = useToast();

    const fetchExcursions = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('excursions')
            .select(`
                id, slug, name, zone, category, operator_name, 
                price_base_usd, price_with_hotel_usd, is_active, is_featured, sort_order, 
                rating, reviews_count,
                description, duration_text, highlights, image_url, gallery_urls, max_capacity, location,
                excursion_plans(count)
            `)
            .order('sort_order', { ascending: true });
            
        if (error) {
            toast({ title: "Error", description: "No se pudieron cargar las excursiones.", variant: "destructive" });
        } else {
            setExcursions(data || []);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchExcursions();
    }, [fetchExcursions]);

    const handleAddNew = () => {
        setCurrentExcursion(null);
        setActiveTab('edit');
    };

    const handleEdit = (excursion) => {
        setCurrentExcursion(excursion);
        setActiveTab('edit');
    };

    const handleManagePlans = (excursion) => {
        setCurrentExcursion(excursion);
        setActiveTab('plans');
    };
    
    const handleToggleState = async (excursionId, field, currentValue) => {
        const { error } = await supabase.from('excursions').update({ [field]: !currentValue }).eq('id', excursionId);
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            setExcursions(prev => prev.map(ex => ex.id === excursionId ? { ...ex, [field]: !currentValue } : ex));
            toast({ title: "Actualizado", description: "El estado ha sido actualizado correctamente." });
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
                        <CardDescription>Crea, edita y gestiona el inventario de excursiones y sus planes.</CardDescription>
                    </div>
                    {activeTab === 'list' && (
                        <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Nueva Excursión</Button>
                    )}
                    {activeTab !== 'list' && (
                        <Button variant="outline" onClick={() => { setActiveTab('list'); fetchExcursions(); }}>Volver al Inventario</Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {activeTab === 'list' && (
                    <ExcursionList 
                        excursions={excursions} 
                        onEdit={handleEdit} 
                        onManagePlans={handleManagePlans}
                        onToggleState={handleToggleState}
                    />
                )}
                {activeTab === 'edit' && (
                    <ExcursionForm 
                        excursion={currentExcursion} 
                        onClose={() => setActiveTab('list')} 
                        onSave={() => {
                            setActiveTab('list');
                            fetchExcursions();
                        }}
                    />
                )}
                {activeTab === 'plans' && (
                    <PlansManager 
                        excursion={currentExcursion} 
                    />
                )}
            </CardContent>
        </Card>
    );
};

const ExcursionList = ({ excursions, onEdit, onManagePlans, onToggleState }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
                <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Zona</th>
                    <th className="px-4 py-3">Operador</th>
                    <th className="px-4 py-3">Precio desde</th>
                    <th className="px-4 py-3 text-center">Planes</th>
                    <th className="px-4 py-3 text-center">Activa</th>
                    <th className="px-4 py-3 text-center">Destacada</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {excursions.map(ex => (
                    <tr key={ex.id} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800">{ex.name}</td>
                        <td className="px-4 py-3">{ex.zone || 'N/A'}</td>
                        <td className="px-4 py-3">{ex.operator_name || 'N/A'}</td>
                        <td className="px-4 py-3">
                            <span className="font-bold text-emerald-600">${ex.price_base_usd || 0} USD</span>
                            <span className="text-xs text-slate-400 ml-1">≈ RD$ {Math.round((ex.price_base_usd || 0) * 58.5).toLocaleString('es-DO')}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-center bg-slate-50">
                            {ex.excursion_plans?.[0]?.count || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                            <Switch checked={!!ex.is_active} onCheckedChange={() => onToggleState(ex.id, 'is_active', !!ex.is_active)} />
                        </td>
                        <td className="px-4 py-3 text-center">
                            <Switch checked={!!ex.is_featured} onCheckedChange={() => onToggleState(ex.id, 'is_featured', !!ex.is_featured)} />
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => onManagePlans(ex)} className="font-semibold">
                                    <ListTodo className="h-4 w-4 mr-1 text-blue-600" /> Planes
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => onEdit(ex)}>
                                    <Edit className="h-4 w-4 text-slate-600" />
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                    onClick={() => window.open(`/dashboard26?tab=excursion&excursion_slug=${ex.slug}`, '_blank')}
                                >
                                    + Reserva
                                </Button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {excursions.length === 0 && <p className="text-center text-slate-500 py-8">No hay excursiones creadas todavía.</p>}
    </div>
);

const ExcursionForm = ({ excursion, onClose, onSave }) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [name, setName] = useState(excursion?.name || '');
    const [slug, setSlug] = useState(excursion?.slug || '');
    const [zone, setZone] = useState(excursion?.zone || '');
    const [operatorName, setOperatorName] = useState(excursion?.operator_name || '');
    const [description, setDescription] = useState(excursion?.description || '');
    const [location, setLocation] = useState(excursion?.location || '');
    const [durationText, setDurationText] = useState(excursion?.duration_text || '');
    const [category, setCategory] = useState(excursion?.category || 'cultural');
    const [highlights, setHighlights] = useState(excursion?.highlights ? excursion.highlights.join(', ') : '');
    
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !slug) {
            toast({ title: "Validación", description: "Por favor completa Nombre y Slug.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const highlightsArray = highlights.split(',').map(h => h.trim()).filter(h => h.length > 0);
        
        const payload = {
            name, slug, zone, operator_name: operatorName, description, location,
            duration_text: durationText, category, highlights: highlightsArray,
            image_url: imageUrl, gallery_urls: galleryUrls,
            price_base_usd: priceBase || null, price_with_hotel_usd: priceHotel || null,
            max_capacity: maxCapacity || null
        };

        const { error } = excursion?.id 
            ? await supabase.from('excursions').update(payload).eq('id', excursion.id)
            : await supabase.from('excursions').insert([payload]);

        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
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
                    <TabsTrigger value="general">Datos Generales</TabsTrigger>
                    <TabsTrigger value="gallery">Galería</TabsTrigger>
                    <TabsTrigger value="pricing">Precios y Detalles</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
                        <div><Label>Slug (URL)</Label><Input value={slug} onChange={e => setSlug(e.target.value)} required /></div>
                        <div><Label>Zona</Label><Input value={zone} onChange={e => setZone(e.target.value)} placeholder="Ej: Punta Cana" /></div>
                        <div><Label>Operador</Label><Input value={operatorName} onChange={e => setOperatorName(e.target.value)} placeholder="Ej: Scape Park" /></div>
                    </div>
                    <div><Label>Descripción</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} /></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><Label>Ubicación Corta</Label><Input value={location} onChange={e => setLocation(e.target.value)} /></div>
                        <div><Label>Duración</Label><Input value={durationText} onChange={e => setDurationText(e.target.value)} placeholder="Ej: Medio Día" /></div>
                        <div>
                            <Label>Categoría</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cultural">Cultural</SelectItem>
                                    <SelectItem value="water">Acuática</SelectItem>
                                    <SelectItem value="extreme">Extrema</SelectItem>
                                    <SelectItem value="buggies">Buggies / Safari</SelectItem>
                                    <SelectItem value="party">Fiesta / Barco</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div><Label>Highlights (separados por coma)</Label><Input value={highlights} onChange={e => setHighlights(e.target.value)} placeholder="Transporte, Bebidas, Guía" /></div>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border rounded-lg bg-slate-50">
                        <div><Label>Precio Base (USD)</Label><Input type="number" step="0.01" value={priceBase} onChange={e => setPriceBase(e.target.value)} placeholder="0.00" /></div>
                        <div><Label>Precio con Hotel (USD)</Label><Input type="number" step="0.01" value={priceHotel} onChange={e => setPriceHotel(e.target.value)} placeholder="0.00" /></div>
                        <div><Label>Capacidad Máxima</Label><Input type="number" value={maxCapacity} onChange={e => setMaxCapacity(e.target.value)} placeholder="50" /></div>
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
                    Guardar Excursión
                </Button>
            </div>
        </form>
    );
};

const PlansManager = ({ excursion }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null);
    const { toast } = useToast();

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('excursion_plans')
            .select('*')
            .eq('excursion_id', excursion.id)
            .order('sort_order', { ascending: true });

        if (error) {
            toast({ title: "Error", description: "No se pudieron cargar los planes.", variant: "destructive" });
        } else {
            setPlans(data || []);
        }
        setLoading(false);
    }, [excursion.id, toast]);

    useEffect(() => { fetchPlans(); }, [fetchPlans]);

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este plan?")) return;
        const { error } = await supabase.from('excursion_plans').delete().eq('id', id);
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Eliminado", description: "El plan ha sido eliminado." });
            fetchPlans();
        }
    };

    const handleToggleState = async (planId, currentValue) => {
        const { error } = await supabase.from('excursion_plans').update({ is_active: !currentValue }).eq('id', planId);
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            setPlans(prev => prev.map(p => p.id === planId ? { ...p, is_active: !currentValue } : p));
            toast({ title: "Actualizado", description: "Estado de plan actualizado." });
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg font-semibold flex justify-between items-center border border-blue-200">
                <span>Gestión de Planes para: {excursion.name}</span>
                <Button size="sm" onClick={() => { setCurrentPlan(null); setIsFormOpen(true); }}>+ Nuevo Plan</Button>
            </div>

            {isFormOpen && (
                <PlanForm 
                    plan={currentPlan} 
                    excursionId={excursion.id} 
                    onClose={() => setIsFormOpen(false)} 
                    onSave={() => { setIsFormOpen(false); fetchPlans(); }} 
                />
            )}

            {!isFormOpen && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs border-b">
                            <tr>
                                <th className="px-4 py-3">Nombre del Plan</th>
                                <th className="px-4 py-3">Duración (Label)</th>
                                <th className="px-4 py-3">Precio Adulto</th>
                                <th className="px-4 py-3">Precio Niño</th>
                                <th className="px-4 py-3 text-center">Activo</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map(p => (
                                <tr key={p.id} className="border-b hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                                    <td className="px-4 py-3">{p.duration_label || 'N/A'}</td>
                                    <td className="px-4 py-3 text-emerald-600 font-bold">${p.price_adult_usd || 0}</td>
                                    <td className="px-4 py-3 text-sky-600 font-bold">${p.price_child_usd || 0}</td>
                                    <td className="px-4 py-3 text-center">
                                        <Switch 
                                            checked={!!p.is_active} 
                                            onCheckedChange={() => handleToggleState(p.id, !!p.is_active)} 
                                        />
                                    </td>
                                    <td className="px-4 py-3 flex items-center justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={() => { setCurrentPlan(p); setIsFormOpen(true); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {plans.length === 0 && (
                                <tr><td colSpan="6" className="text-center py-8 text-slate-500">No hay planes creados. Añade uno.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const PlanForm = ({ plan, excursionId, onClose, onSave }) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [name, setName] = useState(plan?.name || '');
    const [description, setDescription] = useState(plan?.description || '');
    const [durationLabel, setDurationLabel] = useState(plan?.duration_label || '');
    const [adultPrice, setAdultPrice] = useState(plan?.price_adult_usd || '');
    const [childPrice, setChildPrice] = useState(plan?.price_child_usd || '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const payload = {
            excursion_id: excursionId,
            name,
            description,
            duration_label: durationLabel,
            price_adult_usd: adultPrice || 0,
            price_child_usd: childPrice || 0
        };

        const { error } = plan?.id 
            ? await supabase.from('excursion_plans').update(payload).eq('id', plan.id)
            : await supabase.from('excursion_plans').insert([payload]);

        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Éxito", description: "Plan guardado correctamente." });
            onSave();
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-slate-50 space-y-4">
            <h3 className="font-bold text-lg mb-4 text-slate-800">{plan ? 'Editar Plan' : 'Nuevo Plan'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Nombre del Plan</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
                <div><Label>Etiqueta de Duración</Label><Input value={durationLabel} onChange={e => setDurationLabel(e.target.value)} placeholder="Ej: Medio día" /></div>
            </div>
            <div><Label>Descripción</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Precio Adulto (USD)</Label><Input type="number" step="0.01" value={adultPrice} onChange={e => setAdultPrice(e.target.value)} required /></div>
                <div><Label>Precio Niño (USD)</Label><Input type="number" step="0.01" value={childPrice} onChange={e => setChildPrice(e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700">Guardar Plan</Button>
            </div>
        </form>
    );
};

export default AdminExcursionsPage;