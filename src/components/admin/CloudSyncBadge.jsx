import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Cloud, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CloudSyncBadge = ({ tableName = 'hotels_master' }) => {
  const [status, setStatus] = useState('CONNECTING');
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    // 1. Monitor Connection State
    const channel = supabase.channel(`monitor-${tableName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
         // On any event, calculate latency relative to commit_timestamp if available
         const commitTime = new Date(payload.commit_timestamp).getTime();
         const now = Date.now();
         if (!isNaN(commitTime)) {
             setLatency(now - commitTime);
         }
      })
      .subscribe((status) => {
        setStatus(status);
      });

    // 2. Simple Ping/Pong for latency estimation if idle
    const pingInterval = setInterval(async () => {
      const start = Date.now();
      await supabase.from(tableName).select('count', { count: 'exact', head: true });
      setLatency(Date.now() - start);
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pingInterval);
    };
  }, [tableName]);

  const getStatusConfig = () => {
    switch (status) {
      case 'SUBSCRIBED':
        return {
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: <Wifi className="w-3 h-3" />,
          text: 'Realtime Active',
          pulse: true
        };
      case 'CHANNEL_ERROR':
      case 'TIMED_OUT':
        return {
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: <WifiOff className="w-3 h-3" />,
          text: 'Disconnected',
          pulse: false
        };
      default:
        return {
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: <RefreshCw className="w-3 h-3 animate-spin" />,
          text: 'Connecting...',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn("gap-2 transition-all duration-300 cursor-help", config.color)}>
            <div className="relative flex items-center justify-center">
              {config.pulse && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
              )}
              {config.icon}
            </div>
            <span className="hidden sm:inline font-medium">{config.text}</span>
            {status === 'SUBSCRIBED' && (
              <span className="text-[10px] opacity-70 font-mono">{latency}ms</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Status: {status}</p>
          <p>Table: {tableName}</p>
          <p>Latency: {latency}ms</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CloudSyncBadge;