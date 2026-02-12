"use client";

import { useEffect, useState } from 'react';
import { Users, Flame, ThermometerSun, Award, TrendingUp } from 'lucide-react';
import { fetchLeads, Lead } from '../../lib/supabase';
import LeadsChart from '../../components/dashboard/LeadsChart';
import RecentLeads from '../../components/dashboard/RecentLeads';
import FollowUpWidget from '../../components/dashboard/FollowUpWidget';
import { motion } from 'framer-motion';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads().then(data => {
      setLeads(data);
      setLoading(false);
    });
  }, []);

  // Compute Stats
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.lead_quality === 'HOT').length;
  const warmLeads = leads.filter(l => l.lead_quality === 'WARM').length;
  const wonLeads = leads.filter(l => l.status === 'vinto').length;

  // Compute Chart Data (last 30 days)
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = leads.filter(l => l.created_at.startsWith(dateStr)).length;
    return { date: d.getDate() + '/' + (d.getMonth() + 1), count };
  });

  const recentLeads = [...leads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const StatCard = ({ title, value, icon, color, trend }: any) => (
    <motion.div
      variants={itemVariants}
      className="bg-white/60 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/50 flex flex-col justify-between h-32 hover:shadow-lg transition-all duration-300 hover:bg-white/80"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-3xl font-bold mt-1 text-gray-800 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color} shadow-sm bg-opacity-80`}>
          {icon}
        </div>
      </div>
      <div className="flex items-center text-xs text-green-600 font-bold bg-green-50 w-fit px-2 py-1 rounded-full border border-green-100">
        <TrendingUp size={14} className="mr-1" />
        {trend}
      </div>
    </motion.div>
  );

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1">Benvenuto Francesco, ecco i dati aggiornati.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Totale Lead"
          value={totalLeads}
          icon={<Users size={22} className="text-blue-600" />}
          color="bg-blue-100"
          trend="+12%"
        />
        <StatCard
          title="Lead HOT"
          value={hotLeads}
          icon={<Flame size={22} className="text-red-600" />}
          color="bg-red-100"
          trend="+5%"
        />
        <StatCard
          title="Lead WARM"
          value={warmLeads}
          icon={<ThermometerSun size={22} className="text-orange-600" />}
          color="bg-orange-100"
          trend="+2%"
        />
        <StatCard
          title="Contratti Vinti"
          value={wonLeads}
          icon={<Award size={22} className="text-green-600" />}
          color="bg-green-100"
          trend="+8%"
        />
      </div>

      {/* Main Grid: Widgets and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Col: Chart & Recent */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants}>
            <LeadsChart data={chartData} />
          </motion.div>
          <motion.div variants={itemVariants} className="h-[300px]">
            <RecentLeads
              leads={recentLeads}
              onNavigate={(id) => onNavigate(id ? `/dashboard/leads/${id}` : '/dashboard/leads')}
            />
          </motion.div>
        </div>

        {/* Right Col: Intelligent Follow-up */}
        <motion.div variants={itemVariants} className="lg:col-span-1 h-full min-h-[400px]">
          <FollowUpWidget />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;