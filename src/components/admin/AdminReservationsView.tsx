import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { BOOKING_STATUS_LABELS } from '../../config/sirkusConfig';
import { useSirkus } from '../../context/SirkusContext';
import { BookingSource, BookingStatus, SlotStatus } from '../../types/sirkus';
import { formatTanggalID } from '../../utils/bookingUtils';
import { StatusIndicator } from '../StatusIndicator';

interface AdminReservationsViewProps {
  onOpenManualBooking: () => void;
  onGoToVerification: () => void;
}

const SOURCE_LABELS: Record<BookingSource, string> = {
  online: 'Portal Online',
  manual_telepon: 'Telepon / WA',
  manual_walkin: 'Walk-in Lobi',
};

export const AdminReservationsView: React.FC<AdminReservationsViewProps> = ({
  onOpenManualBooking,
  onGoToVerification,
}) => {
  const { state } = useSirkus();
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | BookingSource>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOCKED' | 'ARCHIVE'>('ALL');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.bookings.filter((b) => {
      if (sourceFilter !== 'ALL' && b.source !== sourceFilter) return false;
      if (statusFilter === 'LOCKED') {
        if (
          b.status !== BookingStatus.KEEP &&
          b.status !== BookingStatus.REVISION &&
          b.status !== BookingStatus.BOOKED
        ) {
          return false;
        }
      } else if (statusFilter === 'ARCHIVE') {
        if (
          b.status === BookingStatus.KEEP ||
          b.status === BookingStatus.REVISION ||
          b.status === BookingStatus.BOOKED
        ) {
          return false;
        }
      }

      if (!q) return true;
      return (
        b.bookingCode.toLowerCase().includes(q) ||
        b.institutionName.toLowerCase().includes(q) ||
        b.picName.toLowerCase().includes(q) ||
        b.picPhone.toLowerCase().includes(q)
      );
    });
  }, [state.bookings, search, sourceFilter, statusFilter]);

  return (
    <div className="bg-white border border-[#111111] rounded-none overflow-hidden">
      <div className="px-6 py-4 border-b border-[#111111] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-display font-extrabold text-[#111111] tracking-tight">
              Daftar Seluruh Reservasi Kunjungan ({filtered.length})
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Pantau reservasi dari jalur daring, telepon, dan walk-in beserta kontak lengkap PIC rombongan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGoToVerification}
              className="px-3 py-2 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-[#111111] bg-white border border-[#111111] hover:bg-neutral-100 rounded-none cursor-pointer transition-colors whitespace-nowrap"
            >
              Verifikasi Surat
            </button>
            <button
              type="button"
              onClick={onOpenManualBooking}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] border border-[#111111] hover:border-[#E11D48] rounded-none cursor-pointer transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Input Booking Manual</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center border border-[#111111] bg-[#FDFDFD] rounded-none">
              {(
                [
                  { id: 'ALL', label: 'Semua Status' },
                  { id: 'LOCKED', label: 'Keep & Booked' },
                  { id: 'ARCHIVE', label: 'Selesai / Batal' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatusFilter(item.id)}
                  className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.06em] font-bold rounded-none border-r last:border-r-0 border-[#111111] cursor-pointer transition-colors whitespace-nowrap ${
                    statusFilter === item.id
                      ? 'bg-[#111111] text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-[#111111]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as 'ALL' | BookingSource)}
              aria-label="Filter jalur pendaftaran"
              className="px-2.5 py-1.5 text-xs bg-white border border-[#111111] rounded-none font-mono text-[#111111] focus:outline-none focus:border-[#E11D48]"
            >
              <option value="ALL">Semua Jalur</option>
              <option value="online">Portal Online</option>
              <option value="manual_telepon">Manual Telepon</option>
              <option value="manual_walkin">Manual Walk-in</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode, instansi, atau PIC..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FDFDFD] border border-[#111111] rounded-none focus:bg-white focus:outline-none focus:border-[#E11D48]"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#111111] bg-neutral-100 text-[10px] font-mono uppercase tracking-[0.1em] font-bold text-neutral-600">
              <th className="py-2.5 px-4 whitespace-nowrap">Kode Booking</th>
              <th className="py-2.5 px-4">Instansi & Jenjang</th>
              <th className="py-2.5 px-4">Kontak PIC</th>
              <th className="py-2.5 px-4 whitespace-nowrap">Tanggal & Sesi</th>
              <th className="py-2.5 px-4 text-right whitespace-nowrap">Peserta</th>
              <th className="py-2.5 px-4 whitespace-nowrap">Jalur</th>
              <th className="py-2.5 px-4 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 px-4 text-center text-neutral-500">
                  Tidak ada data reservasi yang cocok dengan filter saat ini.
                </td>
              </tr>
            ) : (
              filtered.map((b) => {
                const session = state.sessions.find((s) => s.id === b.sessionId);
                return (
                  <tr key={b.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#111111] tabular-nums whitespace-nowrap">
                      {b.bookingCode}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#111111]">{b.institutionName}</p>
                      <p className="text-neutral-500 mt-0.5">
                        {b.educationLevel} · {b.activityFocus}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#111111]">{b.picName}</p>
                      <p className="text-neutral-500 font-mono text-[11px] tabular-nums">
                        {b.picPhone}
                      </p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-medium text-[#111111] tabular-nums">
                        {formatTanggalID(b.visitDate)}
                      </p>
                      <p className="text-[11px] font-mono text-neutral-500 tabular-nums">
                        {session?.sessionName} ({session?.timeLabel})
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#111111] tabular-nums whitespace-nowrap">
                      {b.plannedParticipants} org
                    </td>
                    <td className="py-3 px-4 text-neutral-600 whitespace-nowrap font-mono text-[11px]">
                      {SOURCE_LABELS[b.source]}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {b.status === BookingStatus.BOOKED ? (
                        <StatusIndicator status={SlotStatus.BOOKED} />
                      ) : b.status === BookingStatus.KEEP || b.status === BookingStatus.REVISION ? (
                        <StatusIndicator status={SlotStatus.KEEP} />
                      ) : (
                        <span className="text-neutral-500 font-mono text-[11px] uppercase">
                          {BOOKING_STATUS_LABELS[b.status]}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
