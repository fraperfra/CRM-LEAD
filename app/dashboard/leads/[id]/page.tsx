import { supabase } from '@/lib/supabase';
import { LeadDetail } from '@/components/leads/LeadDetail';
import { LeadActions } from '@/components/leads/LeadActions';
import { ActivityTimeline } from '@/components/leads/ActivityTimeline';
import { Phone, Mail, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getLeadQualityColor, getStatusColor } from '@/lib/utils';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    id: string;
  };
}

async function getLeadData(id: string) {
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !lead) {
    return null;
  }

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: false });

  return {
    lead,
    activities: activities || []
  };
}

export default async function LeadDetailPage({ params }: PageProps) {
  const data = await getLeadData(params.id);

  if (!data) {
    notFound();
  }

  const { lead, activities } = data;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/leads"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Torna ai lead
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{lead.nome}</h1>
            <div className="flex items-center gap-4 text-gray-600">
              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 hover:text-blue-600">
                <Mail className="w-4 h-4" />
                {lead.email}
              </a>
              <a href={`tel:${lead.telefono}`} className="flex items-center gap-2 hover:text-blue-600">
                <Phone className="w-4 h-4" />
                {lead.telefono}
              </a>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-md text-sm font-medium border ${getLeadQualityColor(lead.lead_quality)}`}>
                {lead.lead_quality}
              </span>
              <span className={`px-3 py-1.5 rounded-md text-sm font-medium ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Punteggio</p>
              <p className="text-2xl font-bold text-gray-900">{lead.punteggio}/100</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <LeadActions lead={lead} />
      </div>

      {/* Tabs Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <LeadDetail lead={lead} />
        </div>

        {/* Sidebar - 1 column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Timeline Attività
            </h3>
            <ActivityTimeline leadId={params.id} activities={activities} />
          </div>
        </div>
      </div>
    </div>
  );
}