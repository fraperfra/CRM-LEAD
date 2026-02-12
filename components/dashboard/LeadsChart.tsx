import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface LeadsChartProps {
  data: { date: string; count: number }[];
}

const LeadsChart: React.FC<LeadsChartProps> = ({ data }) => {
  return (
    <div className="h-[350px] w-full bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-white/60">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
        Andamento Lead
      </h3>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: -10,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#64748b' }} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#64748b' }} 
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
              }}
              itemStyle={{ color: '#1e293b', fontWeight: 600 }}
              labelStyle={{ color: '#64748b', marginBottom: '0.5rem' }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#2563eb', stroke: '#dbeafe', strokeWidth: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LeadsChart;