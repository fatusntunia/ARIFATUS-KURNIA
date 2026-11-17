import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck2,
  ClipboardCheck,
  Plus,
  Wrench,
} from 'lucide-react';
import { DEFAULT_CALENDAR_FOCUS, useSirkus } from '../../context/SirkusContext';
import { AdminMenuKey, BookingStatus, SlotStatus } from '../../types/sirkus';
import { formatHariTanggalID, formatTanggalID } from '../../utils/bookingUtils';
import { StatusIndicator } from '../StatusIndicator';

interface AdminDashboardOverviewProps {
  onNavigate: (menu: AdminMenuKey) => void;
  onOpenManualBooking: () => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  onNavigate,
  onOpenManualBooking,
}) => {
  const { state, getDaySlots, getMonthlySummary } = useSirkus();

  const monthlySummary = useMemo(
    () =>
      getMonthlySummary(DEFAULT_CALENDAR_FOCUS.year, DEFAULT_CALENDAR_FOCUS.monthIndex),
    [getMonthlySummary]
  );

  const todaySlots = useMemo(
    () => getDaySlots(DEFAULT_CALENDAR_FOCUS.todayISO),
    [getDaySlots]
  );

  const pendingQueue = useMemo(
    () =>
      state.bookings.filter(
        (b) => b.status === BookingStatus.KEEP || b.status === BookingStatus.REVISION
      ),
    [state.bookings]
  );

  const openFacilityIssues = useMemo(
    () => state.facilityIssues.filter((i) => i.status !== 'selesai'),
    [state.facilityIssues]
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border border-[#111111] bg-white divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
        <div className="p-5 space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500">
            Okupansi Sesi Bulan Ini
          </p>
          <p className="text-3xl font-display font-extrabold text-[#111111] tabular-nums">
            {monthlySummary.occupancyPercent}%
          </p>
          <p className="text-xs text-neutral-600 tabular-nums">
            {monthlySummary.bookedCount + monthlySummary.keepCount} dari{' '}
            {monthlySummary.totalWorkingSlots} sesi kerja terisi
          </p>
        </div>

        <div className="p-5 space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500">
            Menunggu Verifikasi Surat
          </p>
          <p className="text-3xl font-display font-extrabold text-amber-700 tabular-nums">
            {pendingQueue.length} Pengajuan
          </p>
          <button
            type="button"
            onClick={() => onNavigate('verifikasi_surat')}
            className="font-mono text-[11px] uppercase tracking-[0.06em] font-bold text-[#111111] hover:text-[#E11D48] inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Buka antrean</span>
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500">
            Total Pemustaka Terjadwal
          </p>
          <p className="text-3xl font-display font-extrabold text-emerald-700 tabular-nums">
            {monthlySummary.totalPlannedParticipants} Org
          </p>
          <p className="text-xs text-neutral-600 tabular-nums">
            Terkunci permanen (Booked): {monthlySummary.bookedCount} sesi
          </p>
        </div>

        <div className="p-5 space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500">
            Kendala Fasilitas Terbuka
          </p>
          <p className="text-3xl font-display font-extrabold text-[#E11D48] tabular-nums">
            {openFacilityIssues.length} Tiket
          </p>
          <button
            type="button"
            onClick={() => onNavigate('kesiapan_ruang')}
            className="font-mono text-[11px] uppercase tracking-[0.06em] font-bold text-[#111111] hover:text-[#E11D48] inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Kelola ruang</span>
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Main Grid: Today's Schedule + Priority Verification Queue */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Status Jadwal Hari Ini + Quick Actions */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-white border border-[#111111] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#111111] flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-display font-bold text-[#111111]">
                  Operasional Hari Ini
                </h2>
                <p className="font-mono text-[11px] text-neutral-500 mt-0.5">
                  {formatHariTanggalID(DEFAULT_CALENDAR_FOCUS.todayISO)}
                </p>
              </div>
              <CalendarCheck2 className="w-4 h-4 text-[#111111]" aria-hidden="true" />
            </div>

            <div className="divide-y divide-neutral-200">
              {todaySlots.map((slot) => (
                <div key={slot.session.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-display font-bold text-[#111111]">
                        {slot.session.sessionName}
                      </p>
                      <p className="text-[11px] font-mono text-neutral-500 tabular-nums">
                        {slot.session.timeLabel}
                      </p>
                    </div>
                    <StatusIndicator status={slot.status} />
                  </div>

                  {slot.booking ? (
                    <div className="text-xs text-neutral-700 bg-neutral-50 border border-neutral-300 p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#111111]">
                          {slot.booking.institutionName}
                        </span>
                        <span className="font-mono text-[11px] text-[#111111] font-bold tabular-nums">
                          {slot.booking.bookingCode}
                        </span>
                      </div>
                      <p className="text-neutral-600 tabular-nums">
                        {slot.booking.plannedParticipants} peserta · PIC: {slot.booking.picName} (
                        {slot.booking.picPhone})
                      </p>
                      <p className="text-neutral-500">
                        Pemandu: {slot.booking.assignedGuide ?? 'Belum ditugaskan'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500">
                      {slot.status === SlotStatus.AVAILABLE
                        ? 'Slot belum terisi — tersedia untuk input walk-in atau booking online.'
                        : slot.statusReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-[#111111] p-5 space-y-3">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] font-bold text-[#111111]">
              Tindakan Cepat Admin
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onOpenManualBooking}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.06em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] rounded-none cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Input Manual</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('verifikasi_surat')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.06em] font-bold text-[#111111] bg-neutral-100 border border-neutral-300 hover:border-[#111111] rounded-none cursor-pointer"
              >
                <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Verifikasi ({pendingQueue.length})</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('kesiapan_ruang')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.06em] font-bold text-[#111111] bg-white border border-neutral-300 hover:border-[#111111] rounded-none cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Kesiapan Ruang</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('laporan')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.06em] font-bold text-[#111111] bg-white border border-neutral-300 hover:border-[#111111] rounded-none cursor-pointer"
              >
                <span>Ekspor Laporan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Priority Keep Queue & Recent Audit Log */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white border border-[#111111] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#111111] flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-display font-bold text-[#111111]">
                  Prioritas Antrean Keep / Verifikasi Berkas
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Pengajuan berstatus Kuning yang memerlukan verifikasi surat atau konfirmasi batas H-3.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('verifikasi_surat')}
                className="font-mono text-[11px] uppercase tracking-[0.08em] font-bold text-[#111111] hover:text-[#E11D48] underline underline-offset-4 cursor-pointer shrink-0"
              >
                Kelola Semua
              </button>
            </div>

            {pendingQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                Seluruh berkas pengajuan telah diproses. Tidak ada antrean Keep saat ini.
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {pendingQueue.map((item) => {
                  const session = state.sessions.find((s) => s.id === item.sessionId);
                  return (
                    <div
                      key={item.id}
                      className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-[#111111] tabular-nums">
                            {item.bookingCode}
                          </span>
                          <span className="text-neutral-300" aria-hidden="true">·</span>
                          <span className="font-semibold text-[#111111]">
                            {item.institutionName}
                          </span>
                          <span className="text-neutral-500">({item.educationLevel})</span>
                        </div>
                        <p className="text-xs text-neutral-600 tabular-nums">
                          {formatTanggalID(item.visitDate)} · {session?.sessionName} (
                          {session?.timeLabel}) · {item.plannedParticipants} peserta
                        </p>
                        <p className="text-[11px] flex items-center gap-1.5">
                          {item.letterFileName ? (
                            <span className="text-emerald-700 font-medium">
                              Surat terunggah: {item.letterFileName}
                            </span>
                          ) : (
                            <span className="text-amber-800 font-medium inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                              Belum unggah surat (tenggat H-3: {formatTanggalID(item.holdExpiresAt.slice(0, 10))})
                            </span>
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigate('verifikasi_surat')}
                        className="px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.06em] font-bold text-[#111111] bg-neutral-100 border border-neutral-300 hover:border-[#111111] rounded-none whitespace-nowrap cursor-pointer shrink-0"
                      >
                        Proses Verifikasi
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Audit Log Ringkas */}
          <div className="bg-white border border-[#111111] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#111111]">
              <h3 className="text-sm font-display font-bold text-[#111111]">
                Aktivitas & Audit Log Terkini
              </h3>
            </div>
            <div className="divide-y divide-neutral-200">
              {state.auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="px-5 py-3 text-xs flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[#111111]">{log.detail}</p>
                    <p className="text-[11px] text-neutral-500">
                      Oleh {log.actor} · Aksi: <span className="font-mono">{log.action}</span>
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400 tabular-nums whitespace-nowrap shrink-0">
                    {log.timestamp.slice(0, 10)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
