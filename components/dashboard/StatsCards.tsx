"use client";

import { Users, Flame, ThermometerSun, Award, TrendingUp, Clock, DollarSign } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    iconName: 'users' | 'flame' | 'thermometer' | 'award' | 'trending-up' | 'clock' | 'dollar-sign';
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'blue' | 'red' | 'orange' | 'green' | 'purple';
    subtitle?: string;
}

const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
};

const iconMap = {
    'users': Users,
    'flame': Flame,
    'thermometer': ThermometerSun,
    'award': Award,
    'trending-up': TrendingUp,
    'clock': Clock,
    'dollar-sign': DollarSign,
};

export function StatsCard({
    title,
    value,
    iconName,
    trend,
    color = 'blue',
    subtitle
}: StatsCardProps) {
    const Icon = iconMap[iconName];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>

                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    )}

                    {trend && (
                        <div className="flex items-center mt-2">
                            <span
                                className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'
                                    }`}
                            >
                                {trend.isPositive ? '+' : ''}{trend.value}%
                            </span>
                            <span className="text-sm text-gray-500 ml-2">vs mese scorso</span>
                        </div>
                    )}
                </div>

                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}
