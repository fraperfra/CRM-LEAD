import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formattazione data italiano
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

// Colore badge quality
export function getLeadQualityColor(quality: string): string {
  switch (quality) {
    case "HOT":
      return "bg-red-100 text-red-800 border-red-200";
    case "WARM":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "COLD":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

// Colore badge status
export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case "nuovo":
      return "bg-purple-100 text-purple-800";
    case "contattato":
      return "bg-blue-100 text-blue-800";
    case "qualificato":
      return "bg-cyan-100 text-cyan-800";
    case "in_trattativa":
      return "bg-yellow-100 text-yellow-800";
    case "vinto":
      return "bg-green-100 text-green-800";
    case "perso":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Formatta valuta euro
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

// Helper to calculate days difference
export function getDaysAgo(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// --- AUTOMATION HELPERS ---

export function formatDelay(minutes: number): string {
  if (minutes === 0) return 'Immediato';
  if (minutes < 60) return `${minutes}min`;
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  return h > 0 ? `${d}g ${h}h` : `${d}g`;
}

export function getTriggerTypeLabel(type: string): string {
  switch (type) {
    case 'lead_created': return 'Lead Creato';
    case 'lead_status_changed': return 'Cambio Status';
    case 'lead_inactive': return 'Lead Inattivo';
    case 'lead_score_changed': return 'Cambio Punteggio';
    default: return type;
  }
}

export function getActionTypeInfo(type: string): { label: string; color: string } {
  switch (type) {
    case 'email': return { label: 'Email', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    case 'whatsapp': return { label: 'WhatsApp', color: 'bg-green-100 text-green-700 border-green-200' };
    case 'notification': return { label: 'Notifica', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'sms': return { label: 'SMS', color: 'bg-purple-100 text-purple-700 border-purple-200' };
    case 'webhook': return { label: 'Webhook', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    default: return { label: type, color: 'bg-gray-100 text-gray-700 border-gray-200' };
  }
}

export function getAutomationLogStatusColor(status: string): string {
  switch (status) {
    case 'success': return 'bg-green-100 text-green-800';
    case 'partial': return 'bg-amber-100 text-amber-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'running': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}