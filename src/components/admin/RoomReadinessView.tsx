import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, Wrench } from 'lucide-react';
import { useSirkus } from '../../context/SirkusContext';
import { BookingStatus, FacilityIssue, ServiceZone } from '../../types/sirkus';
import { formatTanggalID } from '../../utils/bookingUtils';

const ZONE_STATUS_LABELS: Record<ServiceZone['status'], string> = {
  siap: 'Siap Digunakan',
  terbatas: 'Kapasitas Terbatas',
  perbaikan: 'Dalam Perbaikan',
};

export const RoomReadinessView: React.FC = () => {
  const { state, updateZoneStatus, addFacilityIssue, resolveFacilityIssue } = useSirkus();

  const [issueZoneId, setIssueZoneId] = useState(state.serviceZones[0]?.id ?? 'zone-anak');
  const [issueTitle, setIssueTitle] = useState('');
  const [issuePriority, setIssuePriority] = useState<FacilityIssue['priority']>('sedang');
  const [issueNotice, setIssueNotice] = useState<string | null>(null);

  const upcomingBooked = state.bookings.filter(
    (b) => b.status === BookingStatus.BOOKED || b.status === BookingStatus.KEEP
  );

  const handleReportIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addFacilityIssue(issueZoneId, issueTitle, issuePriority);
    setIssueNotice(res.message);
    if (res.ok) {
      setIssueTitle('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Zona Layanan Checklist */}
      <div className="bg-white border border-[#111111] rounded-none overflow-hidden">
        <div className="px-6 py-4 border-b border-[#111111]">
          <h2 className="text-base font-display font-extrabold text-[#111111] tracking-tight">
            Kesiapan Zona Ruang Layanan Wisata Baca
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Pastikan proyektor, audio, AC, dan koleksi literasi siap sebelum rombongan Kelompok Kunjung 1 &amp; 2 tiba pukul 08.00 WIB.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
          {state.serviceZones.map((zone) => (
            <div key={zone.id} className="p-5 space-y-3 border-b border-neutral-200 last:border-b-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-500">
                    {zone.location}
                  </p>
                  <h3 className="text-sm font-display font-bold text-[#111111] mt-0.5">
                    {zone.name}
                  </h3>
                </div>
                <select
                  value={zone.status}
                  onChange={(e) =>
                    updateZoneStatus(zone.id, e.target.value as ServiceZone['status'])
                  }
                  aria-label={`Ubah status ${zone.name}`}
                  className={`px-2.5 py-1 text-[11px] font-mono uppercase font-bold rounded-none border cursor-pointer focus:outline-none ${
                    zone.status === 'siap'
                      ? 'bg-emerald-50 border-emerald-700 text-emerald-900'
                      : zone.status === 'terbatas'
                      ? 'bg-amber-50 border-amber-600 text-amber-900'
                      : 'bg-rose-50 border-[#E11D48] text-[#E11D48]'
                  }`}
                >
                  {(Object.keys(ZONE_STATUS_LABELS) as ServiceZone['status'][]).map((st) => (
                    <option key={st} value={st}>
                      {ZONE_STATUS_LABELS[st]}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-neutral-600">
                Kelengkapan: {zone.facilities.join(', ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Kendala Fasilitas & Penugasan Pemandu */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-[#111111] rounded-none overflow-hidden">
          <div className="px-5 py-4 border-b border-[#111111] flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-display font-bold text-[#111111]">
                Log Kendala Fasilitas & Perbaikan
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Catat gangguan perangkat agar tidak menghambat sesi kunjungan berikutnya.
              </p>
            </div>
            <Wrench className="w-4 h-4 text-[#111111]" aria-hidden="true" />
          </div>

          <form onSubmit={handleReportIssue} className="p-4 bg-[#FDFDFD] border-b border-[#111111] space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                value={issueZoneId}
                onChange={(e) => setIssueZoneId(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-[#111111] rounded-none focus:outline-none focus:border-[#E11D48]"
              >
                {state.serviceZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
              <select
                value={issuePriority}
                onChange={(e) => setIssuePriority(e.target.value as FacilityIssue['priority'])}
                className="px-2.5 py-1.5 text-xs bg-white border border-[#111111] rounded-none focus:outline-none focus:border-[#E11D48]"
              >
                <option value="rendah">Prioritas Rendah</option>
                <option value="sedang">Prioritas Sedang</option>
                <option value="tinggi">Prioritas Tinggi (Kritis)</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="Deskripsikan kendala perangkat / ruangan..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#111111] rounded-none focus:outline-none focus:border-[#E11D48]"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] border border-[#111111] hover:border-[#E11D48] rounded-none cursor-pointer whitespace-nowrap transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Laporkan Kendala</span>
              </button>
            </div>
            {issueNotice && (
              <p className="text-xs text-emerald-800 font-medium">{issueNotice}</p>
            )}
          </form>

          <div className="divide-y divide-neutral-200">
            {state.facilityIssues.map((issue) => {
              const zone = state.serviceZones.find((z) => z.id === issue.zoneId);
              const isResolved = issue.status === 'selesai';
              return (
                <div key={issue.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center gap-2">
                      {isResolved ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
                      )}
                      <span className="font-semibold text-[#111111]">{issue.issueTitle}</span>
                    </div>
                    <p className="text-neutral-500">
                      {zone?.name ?? issue.zoneId} · Prioritas:{' '}
                      <span className="font-mono uppercase">{issue.priority}</span> · Status:{' '}
                      <strong className={isResolved ? 'text-emerald-700' : 'text-[#E11D48]'}>
                        {isResolved ? 'Selesai' : 'Perlu Penanganan'}
                      </strong>
                    </p>
                  </div>
                  {!isResolved && (
                    <button
                      type="button"
                      onClick={() => resolveFacilityIssue(issue.id)}
                      className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-emerald-900 bg-emerald-50 border border-emerald-700 hover:bg-emerald-700 hover:text-white rounded-none cursor-pointer shrink-0 transition-colors"
                    >
                      Tandai Selesai
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Jadwal & Penugasan Pemandu */}
        <div className="lg:col-span-5 bg-white border border-[#111111] rounded-none overflow-hidden">
          <div className="px-5 py-4 border-b border-[#111111]">
            <h3 className="text-sm font-display font-bold text-[#111111]">
              Jadwal Kesiapan Pemandu Sesi Mendatang
            </h3>
          </div>
          <div className="divide-y divide-neutral-200">
            {upcomingBooked.slice(0, 6).map((b) => {
              const session = state.sessions.find((s) => s.id === b.sessionId);
              return (
                <div key={b.id} className="px-5 py-3 text-xs space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#111111]">{b.institutionName}</span>
                    <span className="font-mono text-neutral-500 tabular-nums">
                      {formatTanggalID(b.visitDate)} · {session?.sessionName}
                    </span>
                  </div>
                  <p className="text-neutral-600">
                    Fokus: {b.activityFocus} ·{' '}
                    <span className="font-semibold text-[#111111]">
                      {b.assignedGuide ?? 'Belum ada pemandu'}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
