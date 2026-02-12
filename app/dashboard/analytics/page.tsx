"use client";

import * as React from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
    TrendingUp, Users, Clock, Target, CreditCard, DollarSign,
    Download, FileSpreadsheet, FileText, Calendar, MousePointerClick, MapPin, Home
} from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';

const AnalyticsPage: React.FC = () => {

    // --- MOCK DATA ---

    const kpiData = [
        {
            title: "Conversion Rate",
            value: "4.8%",
            trend: "+0.5%",
            subtext: "Lead vinti su totali",
            icon: <Target size={24} className="text-emerald-600" />,
            color: "bg-emerald-100"
        },
        {
            title: "Tempo Medio Chiusura",
            value: "42 gg",
            trend: "-3 gg",
            subtext: "Da 'Nuovo' a 'Vinto'",
            icon: <Clock size={24} className="text-blue-600" />,
            color: "bg-blue-100"
        },
        {
            title: "Valore Medio Immobile",
            value: "€ 245k",
            trend: "+€12k",
            subtext: "Stima preliminare",
            icon: <Home size={24} className="text-purple-600" />,
            color: "bg-purple-100"
        },
        {
            title: "Top Canale",
            value: "Facebook",
            trend: "45% tot",
            subtext: "Fonte acquisizione",
            icon: <Users size={24} className="text-orange-600" />,
            color: "bg-orange-100"
        }
    ];

    const funnelData = [
        { name: 'Visitatori LP', value: 1500 },
        { name: 'Lead Nuovi', value: 120 },
        { name: 'Contattati', value: 85 },
        { name: 'Qualificati', value: 45 },
        { name: 'In Trattativa', value: 20 },
        { name: 'Vinti', value: 8 },
    ];

    const propertyTypeData = [
        { name: 'Appartamento', value: 65 },
        { name: 'Villa', value: 25 },
        { name: 'Attico', value: 15 },
        { name: 'Ufficio', value: 10 },
        { name: 'Rustico', value: 5 },
    ];

    const motivationData = [
        { name: 'Cambio casa', value: 45 },
        { name: 'Liquidità', value: 20 },
        { name: 'Eredità', value: 15 },
        { name: 'Investimento', value: 10 },
        { name: 'Altro', value: 10 },
    ];

    const landingPageData = [
        { page: '/valuta-gratis-re', visits: 1250, leads: 95, conv: '7.6%' },
        { page: '/vendo-casa-presto', visits: 850, leads: 42, conv: '4.9%' },
        { page: '/stime-immobiliari', visits: 420, leads: 15, conv: '3.5%' },
        { page: '/ebook-vendere', visits: 300, leads: 25, conv: '8.3%' },
    ];

    const campaignData = [
        { name: 'FB_Gen_24_Broad', spend: 450, leads: 32, cpl: 14.06, roi: '250%' },
        { name: 'IG_Stories_Retargeting', spend: 200, leads: 18, cpl: 11.11, roi: '310%' },
        { name: 'Google_Search_Brand', spend: 150, leads: 12, cpl: 12.50, roi: '180%' },
        { name: 'FB_Lookalike_1%', spend: 300, leads: 15, cpl: 20.00, roi: '120%' },
    ];

    // Heatmap Mock Data (Day x Hour intensity 0-10)
    const heatmapData = [
        [0, 2, 5, 8, 4, 2], // Lun
        [1, 3, 7, 9, 5, 3], // Mar
        [1, 4, 8, 8, 6, 2], // Mer
        [0, 3, 6, 9, 5, 4], // Gio
        [2, 5, 8, 7, 4, 1], // Ven
        [0, 1, 4, 5, 2, 0], // Sab
        [0, 0, 2, 3, 1, 0], // Dom
    ];
    const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    const hours = ['9-11', '11-13', '13-15', '15-17', '17-19', '19-21'];

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

    // Animations
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            className="space-y-8 pb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics Avanzate</h1>
                    <p className="text-gray-500 mt-1">Report dettagliati su performance, campagne e conversioni.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all shadow-sm">
                        <FileText size={16} /> Export PDF
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all shadow-sm">
                        <FileSpreadsheet size={16} /> Export Excel
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiData.map((kpi, index) => (
                    <motion.div
                        key={index}
                        variants={itemVariants}
                        className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={`p-3 rounded-xl ${kpi.color} bg-opacity-30 group-hover:scale-110 transition-transform`}>
                                {kpi.icon}
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${kpi.trend.includes('+') ? 'bg-green-50 text-green-700 border-green-100' : kpi.trend.includes('-') ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                                {kpi.trend}
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-800 relative z-10">{kpi.value}</h3>
                        <p className="text-sm text-gray-500 font-medium relative z-10">{kpi.title}</p>
                        <p className="text-xs text-gray-400 mt-1 relative z-10">{kpi.subtext}</p>
                        {/* Decorative background blob */}
                        <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 ${kpi.color.replace('bg-', 'bg-')}`}></div>
                    </motion.div>
                ))}
            </div>

            {/* Row 1: Funnel & Motivation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Conversion Funnel */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Target size={18} className="text-blue-500" />
                        Funnel di Conversione
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={funnelData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={32}>
                                    {funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Motivation Pie */}
                <motion.div variants={itemVariants} className="lg:col-span-1 bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Users size={18} className="text-purple-500" />
                        Motivazione Vendita
                    </h3>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={motivationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {motivationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[65%] text-center pointer-events-none">
                            <span className="text-2xl font-bold text-gray-800">100%</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Row 2: Property Types & Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Property Types */}
                <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Home size={18} className="text-indigo-500" />
                        Lead per Tipologia Immobile
                    </h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={propertyTypeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Heatmap (Custom Grid) */}
                <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Clock size={18} className="text-orange-500" />
                        Orari di Acquisizione Lead
                    </h3>
                    <div className="flex flex-col h-[280px] justify-center">
                        <div className="flex mb-2">
                            <div className="w-10"></div>
                            {hours.map((h, i) => (
                                <div key={i} className="flex-1 text-xs text-center text-gray-400 font-medium">{h}</div>
                            ))}
                        </div>
                        {days.map((day, dIndex) => (
                            <div key={dIndex} className="flex items-center mb-2 last:mb-0">
                                <div className="w-10 text-xs text-gray-500 font-medium">{day}</div>
                                {heatmapData[dIndex].map((value, hIndex) => (
                                    <div key={hIndex} className="flex-1 h-8 mx-0.5 rounded-md relative group cursor-default">
                                        <div
                                            className="w-full h-full rounded-md transition-all duration-300"
                                            style={{
                                                backgroundColor: `rgba(59, 130, 246, ${value / 10})`, // Blue base with opacity
                                                border: value > 0 ? '1px solid rgba(59, 130, 246, 0.1)' : 'none'
                                            }}
                                        ></div>
                                        {/* Tooltip for cell */}
                                        {value > 0 && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                {value} Leads
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Row 3: Performance Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Landing Pages */}
                <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100/50">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <MousePointerClick size={18} className="text-pink-500" />
                            Top Landing Pages
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Page Path</th>
                                    <th className="px-6 py-3">Visite</th>
                                    <th className="px-6 py-3">Lead</th>
                                    <th className="px-6 py-3">Conv. Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/50">
                                {landingPageData.map((page, i) => (
                                    <tr key={i} className="hover:bg-white/50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-gray-800">{page.page}</td>
                                        <td className="px-6 py-3 text-gray-600">{page.visits}</td>
                                        <td className="px-6 py-3 text-gray-600">{page.leads}</td>
                                        <td className="px-6 py-3">
                                            <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                                {page.conv}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Campaigns */}
                <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100/50">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp size={18} className="text-green-500" />
                            Performance Campagne (UTM)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Campagna</th>
                                    <th className="px-6 py-3">Spesa</th>
                                    <th className="px-6 py-3">CPL</th>
                                    <th className="px-6 py-3">ROI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/50">
                                {campaignData.map((camp, i) => (
                                    <tr key={i} className="hover:bg-white/50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-gray-800 truncate max-w-[150px]" title={camp.name}>{camp.name}</td>
                                        <td className="px-6 py-3 text-gray-600">€{camp.spend}</td>
                                        <td className="px-6 py-3 text-gray-600">€{camp.cpl.toFixed(2)}</td>
                                        <td className="px-6 py-3">
                                            <span className={`font-bold px-2 py-0.5 rounded-full border ${parseInt(camp.roi) > 200 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                                                {camp.roi}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default AnalyticsPage;