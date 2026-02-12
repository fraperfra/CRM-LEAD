"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ConversionFunnelProps {
    data: {
        stage: string;
        count: number;
    }[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#f59e0b', '#10b981'];

export function ConversionFunnel({ data }: ConversionFunnelProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Funnel di Conversione
            </h3>

            <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                        <YAxis
                            type="category"
                            dataKey="stage"
                            stroke="#9ca3af"
                            fontSize={12}
                            width={100}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                padding: '0.5rem 0.75rem',
                            }}
                        />
                        <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Conversion rates between stages */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.slice(0, -1).map((stage, idx) => {
                    const nextStage = data[idx + 1];
                    const rate = stage.count > 0
                        ? ((nextStage.count / stage.count) * 100).toFixed(1)
                        : '0';

                    return (
                        <div key={stage.stage} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">
                                {stage.stage} → {nextStage.stage}
                            </p>
                            <p className="text-lg font-bold text-gray-900">{rate}%</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
