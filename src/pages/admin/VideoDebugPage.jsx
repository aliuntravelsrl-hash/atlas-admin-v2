import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { getHotelBySlug } from '@/lib/hotelData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { useHotel } from '@/hooks/useHotel';

const VideoDebugPage = () => {
  const [slugInput, setSlugInput] = useState('occidental-caribe');
  const [activeSlug, setActiveSlug] = useState('occidental-caribe');
  const [dbData, setDbData] = useState(null);
  const [localData, setLocalData] = useState(null);
  
  // Use the actual hook to see what the frontend receives
  const { hotel, loading, source } = useHotel(activeSlug);

  const fetchDirectData = async () => {
    // 1. Get DB Data directly
    const { data } = await supabase
        .from('hotels')
        .select('slug, name, video_id, video_url')
        .eq('slug', activeSlug)
        .maybeSingle();
    setDbData(data);

    // 2. Get Local Data directly
    const local = getHotelBySlug(activeSlug);
    setLocalData(local);
  };

  useEffect(() => {
    fetchDirectData();
  }, [activeSlug]);

  const handleSearch = () => {
    setActiveSlug(slugInput);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <PlayCircle className="text-blue-600" />
                Diagnóstico de Video Hero
            </h1>
            <div className="flex gap-2">
                <Input 
                    value={slugInput} 
                    onChange={(e) => setSlugInput(e.target.value)} 
                    placeholder="Slug del hotel..."
                    className="w-64"
                />
                <Button onClick={handleSearch}>
                    <Search className="w-4 h-4 mr-2" />
                    Analizar
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Database State */}
            <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                    <CardTitle className="text-blue-800">1. Supabase (DB)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    {dbData ? (
                        <>
                            <div className="flex justify-between border-b border-blue-200 pb-1">
                                <span>video_id:</span>
                                <span className="font-mono font-bold">{dbData.video_id || <span className="text-red-500">NULL</span>}</span>
                            </div>
                            <div className="flex justify-between border-b border-blue-200 pb-1">
                                <span>video_url:</span>
                                <span className="font-mono truncate max-w-[150px]">{dbData.video_url || "NULL"}</span>
                            </div>
                        </>
                    ) : (
                        <p className="text-red-500">No encontrado en DB</p>
                    )}
                </CardContent>
            </Card>

            {/* 2. Local State */}
            <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader>
                    <CardTitle className="text-orange-800">2. hotelData.js (Local)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    {localData ? (
                        <>
                             <div className="flex justify-between border-b border-orange-200 pb-1">
                                <span>video_id:</span>
                                <span className="font-mono font-bold">{localData.video_id || localData.videoId || <span className="text-red-500">NULL</span>}</span>
                            </div>
                            <div className="flex justify-between border-b border-orange-200 pb-1">
                                <span>video_url:</span>
                                <span className="font-mono truncate max-w-[150px]">{localData.video_url || localData.videoUrl || "NULL"}</span>
                            </div>
                        </>
                    ) : (
                        <p className="text-red-500">No encontrado en Local</p>
                    )}
                </CardContent>
            </Card>

            {/* 3. Final Hook Output */}
            <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                    <CardTitle className="text-green-800">3. useHotel Output (Final)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    {loading ? (
                        <p>Cargando hook...</p>
                    ) : hotel ? (
                        <>
                             <div className="flex justify-between border-b border-green-200 pb-1">
                                <span>Source:</span>
                                <span className="font-bold">{source}</span>
                            </div>
                            <div className="flex justify-between border-b border-green-200 pb-1">
                                <span>video_id (merged):</span>
                                <span className="font-mono font-bold text-lg">{hotel.video_id || <span className="text-red-500">NULL</span>}</span>
                            </div>
                             <div className="flex justify-between border-b border-green-200 pb-1">
                                <span>video_url (merged):</span>
                                <span className="font-mono truncate max-w-[150px]">{hotel.video_url || "NULL"}</span>
                            </div>
                        </>
                    ) : (
                        <p className="text-red-500">Hook retornó null</p>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* 4. Visual Verification */}
        <Card>
            <CardHeader>
                <CardTitle>4. Prueba Visual (Hero Section Simulation)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="aspect-video w-full max-w-2xl mx-auto bg-black rounded-lg overflow-hidden relative group">
                    {hotel?.video_id ? (
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${hotel.video_id}?autoplay=0&mute=0&controls=1&loop=1&playlist=${hotel.video_id}`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : hotel?.video_url ? (
                        <video controls className="w-full h-full object-cover">
                            <source src={hotel.video_url} type="video/mp4" />
                            Tu navegador no soporta video.
                        </video>
                    ) : (
                         <div className="flex items-center justify-center h-full text-white">
                            <AlertTriangle className="w-12 h-12 text-yellow-500 mb-2" />
                            <p>No hay video disponible para previsualizar</p>
                         </div>
                    )}
                </div>
                <div className="text-center mt-4 text-sm text-gray-500">
                    Lógica usada: {hotel?.video_id ? "YouTube ID (Prioridad)" : (hotel?.video_url ? "Video URL (MP4)" : "Ninguno")}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VideoDebugPage;