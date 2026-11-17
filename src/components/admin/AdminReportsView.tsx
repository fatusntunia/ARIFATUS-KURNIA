import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { BOOKING_STATUS_LABELS, INSTITUTION_INFO } from '../../config/sirkusConfig';
import { DEFAULT_CALENDAR_FOCUS, useSirkus } from '../../context/SirkusContext';
import { BookingStatus } from '../../types/sirkus';
import { formatTanggalID } from '../../utils/bookingUtils';

export const AdminReportsView: React.FC = () => {
  const { state, getMonthlySummary } = useSirkus();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'APPROVED_COMPLETED'>('ALL');

  const monthlySummary = useMemo(
    () =>
      getMonthlySummary(DEFAULT_CALENDAR_FOCUS.year, DEFAULT_CALENDAR_FOCUS.monthIndex),
    [getMonthlySummary]
  );

  const reportRows = useMemo(() => {
    return state.bookings.filter((b) => {
      if (filterStatus === 'APPROVED_COMPLETED') {
        return (
          b.status === BookingStatus.BOOKED || b.status === BookingStatus.COMPLETED
        );
      }
      return true;
    });
  }, [state.bookings, filterStatus]);

  const totals = useMemo(() => {
    const planned = reportRows.reduce((sum, r) => sum + r.plannedParticipants, 0);
    const actual = reportRows.reduce(
      (sum, r) => sum + (r.actualParticipants ?? 0),
      0
    );
    return { planned, actual };
  }, [reportRows]);

  const handleExportCsv = () => {
    const headers = [
      'Kode Booking',
      'Tanggal Kunjungan',
      'Sesi',
      'Nama Instansi',
      'Jenjang',
      'Estimasi Peserta',
      'Peserta Aktual',
      'Fokus Kegiatan',
      'Nama PIC',
      'Telepon PIC',
      'Jalur',
      'Status',
      'Pemandu',
    ];

    const escapeCsv = (val: string | number | undefined) => {
      const str = String(val ?? '');
      return `"${str.replaceAll('"', '""')}"`;
    };

    const lines = [
      headers.map(escapeCsv).join(','),
      ...reportRows.map((b) => {
        const session = state.sessions.find((s) => s.id === b.sessionId);
        return [
          b.bookingCode,
          b.visitDate,
          session ? `${session.sessionName} (${session.timeLabel})` : b.sessionId,
          b.institutionName,
          b.educationLevel,
          b.plannedParticipants,
          b.actualParticipants ?? '-',
          b.activityFocus,
          b.picName,
          b.picPhone,
          b.source,
          BOOKING_STATUS_LABELS[b.status],
          b.assignedGuide ?? '-',
        ]
          .map(escapeCsv)
          .join(',');
      }),
    ];

    // UTF-8 BOM agar terbaca rapi di Microsoft Excel
    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap-SIRKUS-BACA-${DEFAULT_CALENDAR_FOCUS.year}-${
      DEFAULT_CALENDAR_FOCUS.monthIndex + 1
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportBrief = () => {
    const content = [
      `MANAGEMENT BRIEF LAYANAN WISATA BACA — ${INSTITUTION_INFO.appName}`,
      `Instansi: ${INSTITUTION_INFO.agencyName}`,
      `Periode: November ${DEFAULT_CALENDAR_FOCUS.year}`,
      `------------------------------------------------------------`,
      `1. RINGKASAN EKSEKUTIF`,
      `   - Total Slot Kerja Tersedia : ${monthlySummary.totalWorkingSlots} Sesi`,
      `   - Slot Terisi (Booked+Keep) : ${monthlySummary.bookedCount + monthlySummary.keepCount} Sesi (${monthlySummary.occupancyPercent}%)`,
      `   - Total Estimasi Pemustaka  : ${monthlySummary.totalPlannedParticipants} Peserta`,
      ``,
      `2. REKAPITULASI DAFTAR KUNJUNGAN (${reportRows.length} Transaksi)`,
      ...reportRows.map(
        (b, i) =>
          `   ${i + 1}. [${b.bookingCode}] ${b.visitDate} | ${b.institutionName} (${b.educationLevel}) | ${b.plannedParticipants} org | ${BOOKING_STATUS_LABELS[b.status]}`
      ),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Management-Brief-SIRKUS-BACA.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#111111] rounded-none overflow-hidden">
        <div className="px-6 py-4 border-b border-[#111111] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-display font-extrabold text-[#111111] tracking-tight">
              Laporan & Ekspor Rekapitulasi Kunjungan
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Unduh rekapitulasi reservasi ke format CSV (Excel) atau cetak laporan resmi dinas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as 'ALL' | 'APPROVED_COMPLETED')
              }
              className="px-2.5 py-2 text-xs font-mono bg-white border border-[#111111] rounded-none focus:outline-none focus:border-[#E11D48]"
            >
              <option value="ALL">Semua Transaksi ({state.bookings.length})</option>
              <option value="APPROVED_COMPLETED">Hanya Disetujui & Selesai</option>
            </select>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-white bg-emerald-700 hover:bg-emerald-800 border border-emerald-800 rounded-none cursor-pointer transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Ekspor CSV (Excel)</span>
            </button>

            <button
              type="button"
              onClick={handleExportBrief}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] border border-[#111111] hover:border-[#E11D48] rounded-none cursor-pointer transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Management Brief (.txt)</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-[#111111] bg-white border border-[#111111] hover:bg-neutral-100 rounded-none cursor-pointer transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#111111] border-b border-[#111111] bg-[#FDFDFD] text-xs">
          <div className="px-6 py-3">
            <span className="text-neutral-500">Total Rombongan Tercatat: </span>
            <strong className="font-mono text-[#111111] tabular-nums">{reportRows.length}</strong>
          </div>
          <div className="px-6 py-3">
            <span className="text-neutral-500">Total Peserta Rencana: </span>
            <strong className="font-mono text-[#111111] tabular-nums">{totals.planned} orang</strong>
          </div>
          <div className="px-6 py-3">
            <span className="text-neutral-500">Peserta Check-in Aktual: </span>
            <strong className="font-mono text-[#111111] tabular-nums">{totals.actual} orang</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#111111] bg-neutral-100 text-[10px] font-mono uppercase tracking-[0.1em] font-bold text-neutral-600">
                <th className="py-2.5 px-4 whitespace-nowrap">Kode Booking</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Tanggal & Sesi</th>
                <th className="py-2.5 px-4">Instansi & Jenjang</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Rencana</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Aktual</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Status</th>
                <th className="py-2.5 px-4">Pemandu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs">
              {reportRows.map((b) => {
                const session = state.sessions.find((s) => s.id === b.sessionId);
                return (
                  <tr key={b.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-[#111111] tabular-nums whitespace-nowrap">
                      {b.bookingCode}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap tabular-nums">
                      {formatTanggalID(b.visitDate)} · {session?.sessionName}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-[#111111]">{b.institutionName}</span>
                      <span className="text-neutral-500 ml-1.5">({b.educationLevel})</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{b.plannedParticipants}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {b.actualParticipants ?? '-'}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px] text-neutral-700">
                      {BOOKING_STATUS_LABELS[b.status]}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-600">
                      {b.assignedGuide ?? '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
