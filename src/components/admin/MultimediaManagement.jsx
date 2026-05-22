
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import HotelMultimediaTab from '@/components/admin/HotelMultimediaTab';

const MultimediaManagement = () => {
    const [hotels, setHotels] = useState([]);
    const [selectedHotelId, setSelectedHotelId] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Fetch hotels for dropdown
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const { data, error } = await supabase
                    .from('hotels_master')
                    .select('id, name, slug')
                    .order('name');
                
                if (error) throw error;
                setHotels(data || []);
            } catch (error) {
                console.error("Error fetching hotels:", error);
                toast({
                    title: "Error fetching hotels",
                    description: error.message,
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchHotels();
    }, []);

    const handleHotelChange = (value) => {
        setSelectedHotelId(value);
    };

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/3 space-y-2">
                    <label className="text-sm font-medium text-gray-700">Seleccionar Hotel</label>
                    <Select onValueChange={handleHotelChange} value={selectedHotelId || ""}>
                        <SelectTrigger>
                            <SelectValue placeholder="Buscar hotel..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {hotels.map((hotel) => (
                                <SelectItem key={hotel.id} value={hotel.id}>
                                    {hotel.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {selectedHotelId ? (
                <div className="border rounded-lg p-4 bg-gray-50/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <HotelMultimediaTab hotelId={selectedHotelId} />
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 border border-dashed rounded-lg text-gray-500">
                    <p>Por favor seleccione un hotel para comenzar la edición.</p>
                </div>
            )}
        </div>
    );
};

export default MultimediaManagement;
