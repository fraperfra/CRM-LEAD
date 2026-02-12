import { Users, Flame, ThermometerSun, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { StatsCard } from '@/components/dashboard/StatsCards';
import { LeadsChart } from '@/components/dashboard/LeadsChart';
import { RecentLeads } from '@/components/dashboard/RecentLeads';
import EnhancedFollowUpWidget from '@/components/dashboard/EnhancedFollowUpWidget';

// Server Component - data fetching happens on server
export const revalidate = 60; // Revalidate every 60 seconds

async function getDashboardData() {
  // Fetch all leads
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    return { leads: [], stats: null, chartData: [], recentLeads: [] };
  }

  // Calculate stats
  const totalLeads = leads?.length || 0;
  const hotLeads = leads?.filter(l => l.lead_quality === 'HOT').length || 0;
  const warmLeads = leads?.filter(l => l.lead_quality === 'WARM').length || 0;
  const wonLeads = leads?.filter(l => l.status === 'vinto').length || 0;

  // Calculate 30-day chart data
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = leads?.filter(l => l.created_at?.startsWith(dateStr)).length || 0;
    return {
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      count
    };
  });

  // Get recent 5 leads
  const recentLeads = leads?.slice(0, 5) || [];

  return {
    leads: leads || [],
    stats: {
      totalLeads,
      hotLeads,
      warmLeads,
      wonLeads
    },
    chartData,
    recentLeads
  };
}

export default async function DashboardPage() {
  const { stats, chartData, recentLeads } = await getDashboardData();

  if (!stats) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500">Errore nel caricamento dei dati</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Benvenuto Francesco, ecco i dati aggiornati del tuo CRM.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Totale Lead"
          value={stats.totalLeads}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Lead HOT"
          value={stats.hotLeads}
          icon={Flame}
          color="red"
        />
        <StatsCard
          title="Lead WARM"
          value={stats.warmLeads}
          icon={ThermometerSun}
          color="orange"
        />
        <StatsCard
          title="Contratti Vinti"
          value={stats.wonLeads}
          icon={Award}
          color="green"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Charts and Recent (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <LeadsChart data={chartData} />
          <RecentLeads leads={recentLeads} />
        </div>

        {/* Right column - Follow-up Widget (1/3) */}
        <div className="lg:col-span-1">
          <EnhancedFollowUpWidget />
        </div>
      </div>
    </div>
  );
}