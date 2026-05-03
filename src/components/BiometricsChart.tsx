import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';

interface BiometricsChartProps {
  data: any[];
}

export const BiometricsChart: React.FC<BiometricsChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-stone-400 text-sm">
        No progress data yet. Keep logging!
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E8927D" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#E8927D" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(str) => format(new Date(str), 'MMM d')}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#A8A29E' }}
          />
          <YAxis 
            domain={['dataMin - 2', 'dataMax + 2']}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#A8A29E' }}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '16px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontSize: '12px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="weightKg" 
            stroke="#E8927D" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorWeight)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
