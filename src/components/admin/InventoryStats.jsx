
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Building, BedDouble, Calendar, DollarSign, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

const InventoryStats = ({ hotels = [], n8nStatus }) => {
  
  // Calculate aggregations
  const totalHotels = hotels.length;
  const activeHotels = hotels.filter(h => h.is_active).length;
  const inactiveHotels = totalHotels - activeHotels;
  
  const hotelsByCountryData = [
    { name: 'Dom. Rep.', value: totalHotels, color: '#3b82f6' }, // Currently hardcoded as we filtered for one country effectively
    // Add logic here if multi-country data becomes available
  ];

  // If stats are available on hotel objects
  const totalRooms = hotels.reduce((acc, h) => acc + (h.stats?.room_count || 0), 0);
  const totalSeasons = hotels.reduce((acc, h) => acc + (h.stats?.season_count || 0), 0);
  const totalRates = hotels.reduce((acc, h) => acc + (h.stats?.rate_count || 0), 0);

  const getWorkflowColor = (status) => {
    switch(status) {
      case 'ALL_ONLINE': return 'text-green-600 bg-green-50 border-green-200';
      case 'PARTIAL_ONLINE': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'ALL_OFFLINE': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Totals Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Hoteles</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalHotels}</h3>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <Activity className="w-3 h-3 mr-1" /> {activeHotels} Activos
            </p>
          </div>
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Building className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Deep Stats Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4 grid grid-cols-3 gap-2 text-center">
           <div>
              <BedDouble className="w-4 h-4 mx-auto text-purple-500 mb-1" />
              <span className="block text-lg font-bold text-gray-800">{totalRooms}</span>
              <span className="text-[10px] text-gray-500 uppercase">Habitaciones</span>
           </div>
           <div>
              <Calendar className="w-4 h-4 mx-auto text-orange-500 mb-1" />
              <span className="block text-lg font-bold text-gray-800">{totalSeasons}</span>
              <span className="text-[10px] text-gray-500 uppercase">Temporadas</span>
           </div>
           <div>
              <DollarSign className="w-4 h-4 mx-auto text-green-500 mb-1" />
              <span className="block text-lg font-bold text-gray-800">{totalRates}</span>
              <span className="text-[10px] text-gray-500 uppercase">Tarifas</span>
           </div>
        </CardContent>
      </Card>

      {/* 3. Distribution Chart */}
      <Card className="shadow-sm">
         <CardContent className="p-2 h-[100px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[{name: 'Active', value: activeHotels}, {name: 'Inactive', value: inactiveHotels}]}
                  cx="50%" cy="50%" innerRadius={25} outerRadius={35} paddingAngle={5} dataKey="value"
                >
                   <Cell fill="#22c55e" />
                   <Cell fill="#94a3b8" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 ml-2">
               <div>Active: {activeHotels}</div>
               <div>Inactive: {inactiveHotels}</div>
            </div>
         </CardContent>
      </Card>

      {/* 4. n8n Status */}
      <Card className={`shadow-sm border ${getWorkflowColor(n8nStatus?.globalStatus)}`}>
        <CardContent className="p-4">
           <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Estado Workflows</span>
              {n8nStatus?.globalStatus === 'ALL_ONLINE' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
           </div>
           <div className="text-xs space-y-1">
              {Object.entries(n8nStatus?.workflows || {}).slice(0, 3).map(([key, val]) => (
                 <div key={key} className="flex justify-between">
                    <span>Workflow {key}:</span>
                    <span className={val.status === 'ONLINE' ? 'text-green-600' : 'text-red-600'}>{val.status}</span>
                 </div>
              ))}
           </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default InventoryStats;
