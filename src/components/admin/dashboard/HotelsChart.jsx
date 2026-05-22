import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const HotelsChart = ({ data }) => {
  return (
    <Card className="h-[350px]">
      <CardHeader>
        <CardTitle>Top 5 Hoteles Más Cotizados</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={120} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default HotelsChart;