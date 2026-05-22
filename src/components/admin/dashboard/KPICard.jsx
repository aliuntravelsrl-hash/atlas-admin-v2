import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const KPICard = ({ title, value, icon: Icon, description, trend, trendUp, colorString }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow border-l-4" style={{ borderLeftColor: colorString }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" style={{ color: colorString }}>{value}</div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
             {trend && (
                 <span className={cn("mr-1 font-medium", trendUp ? "text-green-600" : "text-red-600")}>
                     {trend}
                 </span>
             )}
             <span>{description}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default KPICard;