import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Database, Search, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { ratesService } from '@/services/ratesService';
import { format } from 'date-fns';

/**
 * Admin Debug Page - Extended for 2026 Diagnostics
 */
const AdminDebugPage = () => {
  const [slug, setSlug] = useState('occidental-caribe');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runDiagnosis = async () => {
    setLoading(true);
    setResults(null);
    setError(null);
    
    try {
      const logs = [];
      const log = (msg) => logs.push({ time: new Date().toISOString(), msg });

      log(`Starting diagnosis for slug: ${slug}`);

      // 1. HOTEL VERIFICATION
      const { data: hotel, error: hotelError } = await supabase
        .from('hotels')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (hotelError) throw new Error(`Database Error (Hotels): ${hotelError.message}`);
      if (!hotel) throw new Error(`Hotel not found with slug: ${slug}`);

      log(`✅ Hotel Found: ${hotel.name} (UUID: ${hotel.id})`);

      // 2. ROOMS VERIFICATION
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', hotel.id);

      if (roomsError) throw new Error(`Database Error (Rooms): ${roomsError.message}`);
      
      log(`🔎 Found ${rooms.length} rooms associated with this UUID.`);

      // 3. RATES VERIFICATION
      const { data: rates, error: ratesError } = await supabase
        .from('rates')
        .select('*, rooms(name)')
        .eq('hotel_id', hotel.id);

      if (ratesError) throw new Error(`Database Error (Rates): ${ratesError.message}`);

      log(`🔎 Found ${rates.length} rate records.`);
      
      // Analyze 2026 Coverage
      const rates2026 = rates.filter(r => r.start_date.includes('2026'));
      log(`   📅 Rates covering 2026: ${rates2026.length} records found.`);

      // 4. SERVICE SIMULATION (Jan 7 2026)
      log(`🔄 Simulating RatesService for Jan 7 - Jan 10, 2026...`);
      
      if (rooms.length > 0) {
          const testRoom = rooms[0];
          // Force specific 2026 dates
          const checkIn = new Date('2026-01-07T12:00:00');
          const checkOut = new Date('2026-01-10T12:00:00');

          log(`   Testing Room: ${testRoom.name} (${testRoom.id})`);
          log(`   Dates: ${format(checkIn, 'yyyy-MM-dd')} to ${format(checkOut, 'yyyy-MM-dd')}`);

          const simResult = await ratesService.calculateTotalPrice({
              hotelId: hotel.id,
              roomId: testRoom.id,
              checkIn,
              checkOut,
              adults: 2,
              children: 0,
              preloadedRates: rates
          });

          if (simResult.available) {
              log(`✅ Simulation SUCCESS: Total $${simResult.total}`);
          } else {
              log(`❌ Simulation FAILED: ${simResult.error}`);
          }
      } 

      setResults({ hotel, rooms, rates, logs });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Database className="w-8 h-8 text-blue-600" />
        System Diagnosis Console
      </h1>
      
      <Card>
        <CardHeader>
           <CardTitle>Rates & 2026 Validity Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex gap-4">
                <Input 
                    placeholder="Enter Hotel Slug (e.g., occidental-caribe)" 
                    value={slug} 
                    onChange={e => setSlug(e.target.value)} 
                />
                <Button onClick={runDiagnosis} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2 w-4 h-4" />}
                    Test Jan 2026
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Diagnosis Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {results && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h3 className="font-bold text-blue-900 mb-2">Hotel Identity</h3>
                            <div className="text-sm space-y-1">
                                <p><span className="font-semibold">Name:</span> {results.hotel.name}</p>
                                <p><span className="font-semibold">UUID:</span> <span className="font-mono bg-blue-100 px-1 rounded">{results.hotel.id}</span></p>
                            </div>
                        </div>
                        <div className={`p-4 rounded-lg border ${results.rates.length > 0 ? 'bg-purple-50 border-purple-100' : 'bg-yellow-50 border-yellow-100'}`}>
                            <h3 className={`font-bold mb-2 ${results.rates.length > 0 ? 'text-purple-900' : 'text-yellow-900'}`}>Rates Check</h3>
                            <div className="text-sm space-y-1">
                                <p><span className="font-semibold">Total Records:</span> {results.rates.length}</p>
                                <p><span className="font-semibold">2026 Records:</span> {results.rates.filter(r => r.start_date.includes('2026')).length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-xs h-96 overflow-y-auto shadow-inner">
                        {results.logs.map((l, i) => (
                            <div key={i} className="mb-1 border-b border-slate-800 pb-1 last:border-0">
                                <span className="text-slate-500">[{l.time.split('T')[1].slice(0,8)}]</span> {l.msg}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDebugPage;