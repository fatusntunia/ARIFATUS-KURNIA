import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, Search, ShieldCheck } from 'lucide-react';
import {
  ACTIVITY_FOCUS_OPTIONS,
  BOOKING_STATUS_LABELS,
  EDUCATION_LEVEL_OPTIONS,
} from '../config/sirkusConfig';
import { DEFAULT_CALENDAR_FOCUS, useSirkus } from '../context/SirkusContext';
import {
  ActivityFocus,
  BookingStatus,
  EducationLevel,
  SlotStatus,
} from '../types/sirkus';
import { formatTanggalID } from '../utils/bookingUtils';
import { StatusIndicator } from './StatusIndicator';

type FilterGroup = 'ALL' | 'KEEP' | 'BOOKED' | 'OTHER';

export const BookingRegistryPanel: React.FC = () => {
  const { state, createBooking, updateBookingStatus } = useSirkus();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterGroup>('ALL');

  // Form Buat Booking / Uji Anti-Bentrok
  const [visitDate, setVisitDate] = useState('2026-11-18');
  const [sessionId, setSessionId] = useState(state.sessions[0]?.id ?? 'sesi-1');
  const [institutionName, setInstitutionName] = useState('');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(EducationLevel.SD);
  const [plannedParticipants, setPlannedParticipants] = useState<number>(35);
  const [activityFocus, setActivityFocus] = useState<ActivityFocus>(ActivityFocus.DONGENG);
  const [picName, setPicName] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [letterFileName, setLetterFileName] = useState('');
  const [formFeedback, setFormFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    bookingCode?: string;
  } | null>(null);

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.bookings.filter((b) => {
      const matchesFilter =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'KEEP'
          ? b.status === BookingStatus.KEEP || b.status === BookingStatus.REVISION
          : statusFilter === 'BOOKED'
          ? b.status === BookingStatus.BOOKED
          : b.status === BookingStatus.COMPLETED ||
            b.status === BookingStatus.CANCELLED ||
            b.status === BookingStatus.REJECTED ||
            b.status === BookingStatus.AUTO_RELEASED;

      if (!matchesFilter) return false;
      if (!q) return true;

      return (
        b.bookingCode.toLowerCase().includes(q) ||
        b.institutionName.toLowerCase().includes(q) ||
        b.picName.toLowerCase().includes(q)
      );
    });
  }, [state.bookings, searchQuery, statusFilter]);

  const mapBookingToSlotStatus = (status: BookingStatus): SlotStatus => {
    if (status === BookingStatus.BOOKED || status === BookingStatus.COMPLETED) {
      return SlotStatus.BOOKED;
    }
    if (status === BookingStatus.KEEP || status === BookingStatus.REVISION) {
      return SlotStatus.KEEP;
    }
    return SlotStatus.AVAILABLE;
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createBooking({
      institutionName,
      educationLevel,
      institutionAddress: 'Alamat Instansi',
      picName,
      picPhone,
      picEmail: '-',
      visitDate,
      sessionId,
      plannedParticipants: Number(plannedParticipants),
      activityFocus,
      letterFileName: letterFileName || undefined,
      source: 'online',
      initialStatus: BookingStatus.KEEP,
    });

    if (res.ok && res.data) {
      setFormFeedback({
        type: 'success',
        message: res.message,
        bookingCode: res.data.bookingCode,
      });
      setInstitutionName('');
      setPicName('');
      setPicPhone('');
      setLetterFileName('');
    } else {
      setFormFeedback({
        type: 'error',
        message: res.message,
      });
    }
  };

  const prefillConflictScenario = () => {
    // Sengaja mengarah ke 2026-11-18 Sesi 1 yang sudah Booked oleh SMPN 4 Harapan
    setVisitDate('2026-11-18');
    setSessionId('sesi-1');
    setInstitutionName('SDN Uji Bentrok Ganda');
    setEducationLevel(EducationLevel.SD);
    setPlannedParticipants(40);
    setPicName('Bapak Andi');
    setPicPhone('081234567890');
    setFormFeedback(null);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Left: Daftar Booking Table */}
      <div className="xl:col-span-8 bg-white border border-[#111111] rounded-none overflow-hidden">
        <div className="px-5 py-4 border-b border-[#111111] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-display font-extrabold text-[#111111] tracking-tight">
                Daftar Booking Terdaftar ({filteredBookings.length})
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Setiap reservasi memiliki kode booking unik dan terikat pada satu kombinasi (tanggal, sesi).
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode booking / instansi..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FDFDFD] border border-[#111111] rounded-none focus:bg-white focus:outline-none focus:border-[#E11D48]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center border border-[#111111] bg-[#FDFDFD] rounded-none w-fit">
            {(
              [
                { id: 'ALL', label: 'Semua' },
                { id: 'KEEP', label: 'Keep / Pending (Kuning)' },
                { id: 'BOOKED', label: 'Booked (Merah)' },
                { id: 'OTHER', label: 'Selesai / Dilepas' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.06em] font-bold rounded-none border-r last:border-r-0 border-[#111111] transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#111111] text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-[#111111]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#111111] bg-neutral-100 text-[10px] font-mono uppercase tracking-[0.1em] font-bold text-neutral-600">
                <th className="py-2.5 px-4 whitespace-nowrap">Kode Booking</th>
                <th className="py-2.5 px-4">Instansi & PIC</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Tanggal & Sesi</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Peserta</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Status Slot</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Aksi State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-neutral-500">
                    Tidak ada data booking yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const session = state.sessions.find((s) => s.id === booking.sessionId);
                  const isLocked =
                    booking.status === BookingStatus.KEEP ||
                    booking.status === BookingStatus.BOOKED;

                  return (
                    <tr key={booking.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#111111] tabular-nums whitespace-nowrap">
                        {booking.bookingCode}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#111111]">{booking.institutionName}</p>
                        <p className="text-neutral-500 mt-0.5">
                          {booking.educationLevel} · {booking.picName}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-medium text-[#111111] tabular-nums">
                          {formatTanggalID(booking.visitDate)}
                        </p>
                        <p className="text-neutral-500 font-mono text-[11px] tabular-nums">
                          {session?.sessionName} ({session?.startTime}–{session?.endTime})
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#111111] tabular-nums whitespace-nowrap">
                        {booking.plannedParticipants} org
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isLocked ? (
                          <StatusIndicator status={mapBookingToSlotStatus(booking.status)} />
                        ) : (
                          <span className="font-mono text-[11px] uppercase text-neutral-500">
                            {BOOKING_STATUS_LABELS[booking.status]}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {booking.status === BookingStatus.KEEP && (
                            <button
                              type="button"
                              onClick={() =>
                                updateBookingStatus(
                                  booking.id,
                                  BookingStatus.BOOKED,
                                  'Disetujui dari daftar booking.'
                                )
                              }
                              className="px-2.5 py-1 text-[11px] font-mono uppercase font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-none cursor-pointer transition-colors"
                            >
                              Setujui
                            </button>
                          )}
                          {isLocked && (
                            <button
                              type="button"
                              onClick={() =>
                                updateBookingStatus(
                                  booking.id,
                                  BookingStatus.CANCELLED,
                                  'Slot dilepas oleh admin.'
                                )
                              }
                              className="px-2.5 py-1 text-[11px] font-mono uppercase font-bold text-[#111111] bg-white border border-[#111111] hover:bg-neutral-100 rounded-none cursor-pointer transition-colors"
                            >
                              Lepas
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: Form Input & Uji Anti-Bentrok */}
      <div className="xl:col-span-4 bg-white border border-[#111111] rounded-none p-5 space-y-4">
        <div className="pb-3 border-b border-[#111111] flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-display font-bold text-[#111111]">
              Tambah Booking & Uji Anti-Bentrok
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Menguji generator kode unik & penolakan otomatis jika slot sudah dikunci.
            </p>
          </div>
          <button
            type="button"
            onClick={prefillConflictScenario}
            className="text-[10px] font-mono uppercase tracking-[0.06em] font-bold text-[#E11D48] hover:underline whitespace-nowrap cursor-pointer"
          >
            Isi Skenario Bentrok
          </button>
        </div>

        {formFeedback && (
          <div
            role="status"
            className={`p-3 rounded-none border text-xs leading-relaxed flex items-start gap-2 ${
              formFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-700 text-emerald-950'
                : 'bg-rose-50 border-[#E11D48] text-rose-950'
            }`}
          >
            {formFeedback.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#E11D48]" />
            )}
            <div>
              <p>{formFeedback.message}</p>
              {formFeedback.bookingCode && (
                <p className="mt-1 font-mono font-bold text-[#111111]">
                  Kode Tiket: {formFeedback.bookingCode}
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitBooking} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
                Tanggal Kunjungan
              </label>
              <input
                type="date"
                required
                min={DEFAULT_CALENDAR_FOCUS.todayISO}
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#111111] rounded-none tabular-nums focus:outline-none focus:border-[#E11D48]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
                Kelompok Kunjung (2/Hari)
              </label>
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-white border border-[#111111] rounded-none focus:outline-none focus:border-[#E11D48]"
              >
                {state.sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sessionName} ({s.startTime}–{s.endTime})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
              Nama Sekolah / Instansi / Komunitas
            </label>
            <input
              type="text"
              required
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="Misal: SDN 05 Kebon Sirih"
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#111111] rounded-none focus:outline-none focus:border-[#E11D48]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
                Jenjang Peserta
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
                className="w-full px-2 py-1.5 text-xs bg-white border border-[#111111] rounded-none focus:outline-none focus:border-[#E11D48]"
              >
                {EDUCATION_LEVEL_OPTIONS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
                Estimasi Peserta
              </label>
              <input
                type="number"
                min={1}
                max={200}
                required
                value={plannedParticipants}
                onChange={(e) => setPlannedParticipants(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#111111] rounded-none tabular-nums focus:outline-none focus:border-[#E11D48]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
              Fokus Kegiatan Literasi
            </label>
            <select
              value={activityFocus}
              onChange={(e) => setActivityFocus(e.target.value as ActivityFocus)}
              className="w-full px-2 py-1.5 text-xs bg-white border border-[#111111] rounded-none focus:outline-none focus:border-[#E11D48]"
            >
              {ACTIVITY_FOCUS_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
                Nama PIC / Guru
              </label>
              <input
                type="text"
                required
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder="Nama lengkap"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#111111] rounded-none focus:outline-none focus:border-[#E11D48]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
                No. WhatsApp PIC
              </label>
              <input
                type="tel"
                required
                value={picPhone}
                onChange={(e) => setPicPhone(e.target.value)}
                placeholder="0812..."
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#111111] rounded-none tabular-nums focus:outline-none focus:border-[#E11D48]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
              Nama Berkas Surat Permohonan (Opsional)
            </label>
            <input
              type="text"
              value={letterFileName}
              onChange={(e) => setLetterFileName(e.target.value)}
              placeholder="Contoh: Surat_Permohonan_SDN05.pdf"
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#111111] rounded-none focus:outline-none focus:border-[#E11D48]"
            />
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] rounded-none transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Simpan Booking & Validasi Bentrok</span>
          </button>
        </form>

        <div className="pt-3 border-t border-neutral-200 flex items-center gap-2 text-[11px] text-neutral-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>Constraint aktif: 1 kombinasi (visit_date, session_id) hanya boleh 1 booking aktif.</span>
        </div>
      </div>
    </div>
  );
};
