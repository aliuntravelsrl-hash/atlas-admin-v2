
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, AlertTriangle, PlayCircle, Image as ImageIcon, Database, Server, ShieldCheck, FileCheck } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const MediaSyncDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const { toast } = useToast();

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Fetch basic counts
            const { count: totalHotels } = await supabase.from('hotels_master').select('*', { count: 'exact', head: true });
            
            // Validate sync status (Dual Mirror Check)
            const { data: hotels } = await supabase
                .from('hotels_master')
                .select('id, gallery_data, hero_video');
            
            const { data: legacyHotels } = await supabase
                .from('hotels')
                .select('id, gallery_data, hero_video');

            // Map legacy hotels for comparison
            const legacyMap = new Map(legacyHotels?.map(h => [h.id, h]) || []);

            let syncedCount = 0;
            let desyncCount = 0;
            let totalGalleryItems = 0;
            let videoEnabledCount = 0;

            hotels?.forEach(hm => {
                const h = legacyMap.get(hm.id);
                
                // Integrity Check
                const isSynced = h && 
                    JSON.stringify(hm.gallery_data) === JSON.stringify(h.gallery_data) &&
                    JSON.stringify(hm.hero_video) === JSON.stringify(h.hero_video);
                
                if (isSynced) syncedCount++;
                else desyncCount++;

                // Media counts
                if (Array.isArray(hm.gallery_data)) totalGalleryItems += hm.gallery_data.length;
                if (hm.hero_video && hm.hero_video.youtube_id) videoEnabledCount++;
            });

            // Get last sync from audit log
            const { data: lastLog } = await supabase
                .from('sync_audit_log')
                .select('created_at')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            setStats({
                totalHotels: totalHotels || 0,
                syncedHotels: syncedCount,
                desyncHotels: desyncCount,
                totalGalleryItems,
                videoEnabledCount,
                lastSync: lastLog?.created_at,
                syncRate: totalHotels > 0 ? Math.round((syncedCount / totalHotels) * 100) : 0
            });

        } catch (error) {
            console.error("Error fetching sync stats:", error);
            toast({
                title: "Error fetching statistics",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGlobalSync = async () => {
        setSyncing(true);
        try {
            // Trigger massive sync via SQL RPC
            // Since we can't call DO blocks directly from client easily without edge function, 
            // we'll rely on the user running the SQL script provided in Task 5. 
            // However, for this UI button, we can simulate by fetching all IDs and calling the RPC individually.
            
            const { data: hotels } = await supabase.from('hotels_master').select('id');
            
            if (!hotels) throw new Error("No hotels found");

            let success = 0;
            for (const hotel of hotels) {
                const { error } = await supabase.rpc('sync_hotel_media_mirror_dual', { p_hotel_id: hotel.id });
                if (!error) success++;
            }

            toast({
                title: "Global Sync Completed",
                description: `Successfully synchronized ${success}/${hotels.length} hotels.`,
            });
            
            fetchStats(); // Refresh stats

        } catch (error) {
             toast({
                title: "Sync Failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <Card className="w-full h-64 flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-sm text-gray-500">Analysing Mirror Integrity...</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="border-t-4 border-t-blue-600 shadow-md">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-600" />
                            SSOT Multimedia v6.5 Dashboard
                        </CardTitle>
                        <CardDescription>Real-time monitoring of Dual-Write Mirror Synchronization.</CardDescription>
                    </div>
                    <Badge variant={stats.syncRate === 100 ? "default" : "destructive"} className={cn("text-sm px-3 py-1", stats.syncRate === 100 ? "bg-green-600 hover:bg-green-700" : "")}>
                         {stats.syncRate === 100 ? "SYSTEM HEALTHY" : "SYNC ISSUES DETECTED"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 mb-1 text-slate-500 text-xs uppercase font-bold">
                            <Server className="h-3 w-3" /> Total Hotels
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{stats.totalHotels}</div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <div className="flex items-center gap-2 mb-1 text-green-600 text-xs uppercase font-bold">
                            <ShieldCheck className="h-3 w-3" /> Synced
                        </div>
                        <div className="text-2xl font-bold text-green-700">{stats.syncedHotels}</div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 mb-1 text-blue-600 text-xs uppercase font-bold">
                            <ImageIcon className="h-3 w-3" /> Gallery Items
                        </div>
                        <div className="text-2xl font-bold text-blue-700">{stats.totalGalleryItems}</div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <div className="flex items-center gap-2 mb-1 text-purple-600 text-xs uppercase font-bold">
                            <PlayCircle className="h-3 w-3" /> Video Enabled
                        </div>
                        <div className="text-2xl font-bold text-purple-700">{stats.videoEnabledCount}</div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-full", stats.desyncHotels === 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
                            {stats.desyncHotels === 0 ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {stats.desyncHotels === 0 ? "All mirrors are perfectly synchronized." : `${stats.desyncHotels} hotels are out of sync.`}
                            </p>
                            <p className="text-xs text-gray-500">
                                Last global sync: {stats.lastSync ? new Date(stats.lastSync).toLocaleString() : 'Never'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchStats} disabled={syncing}>
                            <RefreshCw className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
                            Verify Integrity
                        </Button>
                        <Button size="sm" onClick={handleGlobalSync} disabled={syncing} className="bg-blue-600 hover:bg-blue-700">
                            <RefreshCw className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
                            Force Full Sync
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default MediaSyncDashboard;
