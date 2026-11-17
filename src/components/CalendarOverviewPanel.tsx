import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  BOOKING_STATUS_LABELS,
  EDUCATION_LEVEL_OPTIONS,
  SLOT_STATUS_CONFIG,
} from '../config/sirkusConfig';
import { DEFAULT_CALENDAR_FOCUS, useSirkus } from '../context/SirkusContext';
import {
  ActivityFocus,
  BookingStatus,
  EducationLevel,
  SlotResolution,
  SlotStatus,
} from '../types/sirkus';
import {
  buildCalendarMonthGrid,
  formatBulanTahunID,
  formatHariTanggalID,
  formatTanggalID,
} from '../utils/bookingUtils';
import { StatusIcon, StatusIndicator } from './StatusIndicator';

const WEEKDAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const CalendarOverviewPanel: React.FC = () => {
  const {
    state,
    getDaySlots,
    getMonthlySummary,
    createBooking,
    updateBookingStatus,
  } = useSirkus();

  const [viewYear, setViewYear] = useState(DEFAULT_CALENDAR_FOCUS.year);
  const [viewMonth, setViewMonth] = useState(DEFAULT_CALENDAR_FOCUS.monthIndex);
  const [selectedDateISO, setSelectedDateISO] = useState(DEFAULT_CALENDAR_FOCUS.todayISO);

  // State untuk form uji cepat penguncian slot (Quick Test Keep/Conflict)
  const [quickSessionId, setQuickSessionId] = useState<string | null>(null);
  const [quickInstitution, setQuickInstitution] = useState('');
  const [quickLevel, setQuickLevel] = useState<EducationLevel>(EducationLevel.SD);
  const [quickParticipants, setQuickParticipants] = useState<number>(35);
  const [quickPicName, setQuickPicName] = useState('');
  const [quickPicPhone, setQuickPicPhone] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const gridCells = useMemo(
    () => buildCalendarMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const monthlySummary = useMemo(
    () => getMonthlySummary(viewYear, viewMonth),
    [getMonthlySummary, viewYear, viewMonth]
  );

  const selectedDaySlots = useMemo(
    () => getDaySlots(selectedDateISO),
    [getDaySlots, selectedDateISO]
  );

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleResetToday = () => {
    setViewYear(DEFAULT_CALENDAR_FOCUS.year);
    setViewMonth(DEFAULT_CALENDAR_FOCUS.monthIndex);
    setSelectedDateISO(DEFAULT_CALENDAR_FOCUS.todayISO);
    setActionFeedback(null);
  };

  const openQuickLockForm = (slot: SlotResolution) => {
    setQuickSessionId(slot.session.id);
    setActionFeedback(null);
  };

  const handleQuickCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSessionId) return;

    const result = createBooking({
      institutionName: quickInstitution,
      educationLevel: quickLevel,
      institutionAddress: 'Alamat Terdaftar (Input Cepat)',
      picName: quickPicName,
      picPhone: quickPicPhone,
      picEmail: '-',
      visitDate: selectedDateISO,
      sessionId: quickSessionId,
      plannedParticipants: Number(quickParticipants),
      activityFocus: ActivityFocus.PAKET_LENGKAP,
      source: 'online',
      initialStatus: BookingStatus.KEEP,
    });

    if (result.ok) {
      setActionFeedback({ type: 'success', message: result.message });
      setQuickInstitution('');
      setQuickPicName('');
      setQuickPicPhone('');
      setQuickSessionId(null);
    } else {
      setActionFeedback({ type: 'error', message: result.message });
    }
  };

  const handleSimulateConflict = (slot: SlotResolution) => {
    const result = createBooking({
      institutionName: 'SDN Uji Bentrok Simulasi',
      educationLevel: EducationLevel.SD,
      institutionAddress: 'Jl. Uji Coba No. 1',
      picName: 'Petugas Uji',
      picPhone: '081200000000',
      picEmail: 'uji@sekolah.id',
      visitDate: selectedDateISO,
      sessionId: slot.session.id,
      plannedParticipants: 30,
      activityFocus: ActivityFocus.DONGENG,
    });

    setActionFeedback({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    });
  };

  return (
    <div className="space-y-6">
      {/* 4-column summary strip (sharp architectural grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#111111] bg-white divide-y lg:divide-y-0 lg:divide-x divide-[#111111] rounded-none">
        <div className="p-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-neutral-500">
            Slot Tersedia (Hijau)
          </p>
          <p className="mt-1.5 text-2xl font-display font-extrabold text-emerald-700 tabular-nums">
            {monthlySummary.availableCount}
            <span className="text-xs font-mono font-normal text-neutral-500 ml-1.5">
              / {monthlySummary.totalWorkingSlots} sesi kerja
            </span>
          </p>
        </div>

        <div className="p-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-neutral-500">
            Keep / Pending (Kuning)
          </p>
          <p className="mt-1.5 text-2xl font-display font-extrabold text-amber-700 tabular-nums">
            {monthlySummary.keepCount}
            <span className="text-xs font-mono font-normal text-neutral-500 ml-1.5">
              menunggu verifikasi
            </span>
          </p>
        </div>

        <div className="p-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-neutral-500">
            Terkunci / Booked (Merah)
          </p>
          <p className="mt-1.5 text-2xl font-display font-extrabold text-[#E11D48] tabular-nums">
            {monthlySummary.bookedCount}
            <span className="text-xs font-mono font-normal text-neutral-500 ml-1.5">
              disetujui
            </span>
          </p>
        </div>

        <div className="p-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-neutral-500">
            Okupansi & Estimasi Peserta
          </p>
          <p className="mt-1.5 text-2xl font-display font-extrabold text-[#111111] tabular-nums">
            {monthlySummary.occupancyPercent}%
            <span className="text-xs font-mono font-normal text-neutral-500 ml-1.5">
              · {monthlySummary.totalPlannedParticipants} pemustaka
            </span>
          </p>
        </div>
      </div>

      {/* Main 2-Column Calendar + Slot Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Monthly 2-Session Matrix */}
        <div className="xl:col-span-8 bg-white border border-[#111111] rounded-none overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-[#111111]">
            <div>
              <h2 className="text-base font-display font-extrabold text-[#111111] tracking-tight">
                Kalender Ketersediaan 2 Kelompok Kunjung — {formatBulanTahunID(viewYear, viewMonth)}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Klik tanggal untuk memeriksa detail penguncian Kelompok Kunjung 1 &amp; Kelompok Kunjung 2 (08.00–12.00 WIB).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetToday}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-[#111111] bg-white border border-[#111111] hover:bg-neutral-100 rounded-none transition-colors whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Hari Ini (17 Nov)</span>
              </button>
              <div className="flex items-center border border-[#111111] rounded-none overflow-hidden">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Bulan sebelumnya"
                  className="p-2 text-[#111111] hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-[#111111] border-x border-[#111111] py-2 whitespace-nowrap tabular-nums">
                  {formatBulanTahunID(viewYear, viewMonth)}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Bulan berikutnya"
                  className="p-2 text-[#111111] hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-[#111111] bg-neutral-100">
            {WEEKDAY_HEADERS.map((day) => (
              <div
                key={day}
                className="py-2.5 text-center text-[10px] font-mono uppercase tracking-[0.12em] font-bold text-neutral-600 border-r last:border-r-0 border-neutral-200"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7">
            {gridCells.map((cell) => {
              const slots = getDaySlots(cell.dateISO);
              const isSelected = cell.dateISO === selectedDateISO;
              const isToday = cell.dateISO === DEFAULT_CALENDAR_FOCUS.todayISO;

              return (
                <button
                  key={cell.dateISO}
                  type="button"
                  onClick={() => {
                    setSelectedDateISO(cell.dateISO);
                    setQuickSessionId(null);
                    setActionFeedback(null);
                  }}
                  className={`min-h-[104px] p-2 text-left border-b border-r border-neutral-200 transition-colors flex flex-col justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#111111] ${
                    !cell.isCurrentMonth ? 'bg-neutral-50 opacity-50' : 'bg-white hover:bg-neutral-50'
                  } ${isSelected ? 'ring-2 ring-inset ring-[#111111] bg-neutral-50' : ''}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono font-bold tabular-nums px-1.5 py-0.5 rounded-none ${
                        isToday
                          ? 'bg-[#E11D48] text-white'
                          : isSelected
                          ? 'bg-[#111111] text-white'
                          : 'text-[#111111]'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-mono uppercase font-bold text-[#E11D48] whitespace-nowrap">
                        Hari ini
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1 w-full">
                    {slots.map((slot, idx) => {
                      const meta = SLOT_STATUS_CONFIG[slot.status];
                      return (
                        <div
                          key={slot.session.id}
                          className={`flex items-center justify-between gap-1 px-1.5 py-1 rounded-none border text-[10px] font-mono leading-none ${meta.cellClass}`}
                          title={`${slot.session.sessionName}: ${meta.label} — ${slot.statusReason}`}
                        >
                          <span className="font-bold tabular-nums shrink-0">
                            K{idx + 1}
                          </span>
                          <span className="inline-flex items-center gap-1 truncate font-bold uppercase tracking-tight">
                            <StatusIcon status={slot.status} className="w-3 h-3 shrink-0" />
                            <span className="truncate">{meta.shortLabel}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Date Slot Inspector & Conflict Validation */}
        <div className="xl:col-span-4 bg-white border border-[#111111] rounded-none p-5 space-y-5">
          <div className="pb-4 border-b border-[#111111]">
            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-500">
              Inspeksi Slot Tanggal
            </p>
            <h3 className="mt-1 text-lg font-display font-extrabold text-[#111111]">
              {formatHariTanggalID(selectedDateISO)}
            </h3>
            <p className="mt-1 text-xs font-mono text-neutral-500 tabular-nums">
              Jam layanan: 08.00 – 12.00 WIB · Aturan: 2 kelompok kunjung / hari
            </p>
          </div>

          {actionFeedback && (
            <div
              role="status"
              className={`p-3 rounded-none border text-xs leading-relaxed flex items-start gap-2 ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-700 text-emerald-900'
                  : 'bg-rose-50 border-[#E11D48] text-rose-950'
              }`}
            >
              {actionFeedback.type === 'success' ? (
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#E11D48]" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
          )}

          <div className="space-y-4">
            {selectedDaySlots.map((slot) => {
              const meta = SLOT_STATUS_CONFIG[slot.status];
              const isEditingThisSlot = quickSessionId === slot.session.id;

              return (
                <div
                  key={slot.session.id}
                  className="border border-[#111111] rounded-none p-4 space-y-3 bg-[#FDFDFD]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-display font-bold text-[#111111]">
                        {slot.session.sessionName}
                      </p>
                      <p className="text-xs font-mono text-neutral-600 tabular-nums mt-0.5">
                        {slot.session.timeLabel} · Kuota maks. {slot.session.maxCapacity} org
                      </p>
                    </div>
                    <StatusIndicator status={slot.status} />
                  </div>

                  {/* Detail Slot sesuai status */}
                  {slot.status === SlotStatus.AVAILABLE && (
                    <div className="space-y-3">
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {meta.description}
                      </p>

                      {!isEditingThisSlot ? (
                        <button
                          type="button"
                          onClick={() => openQuickLockForm(slot)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] rounded-none transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Uji Keep Slot (Buat Booking Cepat)</span>
                        </button>
                      ) : (
                        <form onSubmit={handleQuickCreateSubmit} className="space-y-2.5 pt-2 border-t border-neutral-200">
                          <div>
                            <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
                              Nama Sekolah / Instansi
                            </label>
                            <input
                              type="text"
                              required
                              value={quickInstitution}
                              onChange={(e) => setQuickInstitution(e.target.value)}
                              placeholder="Misal: SDN 03 Cempaka"
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#111111] rounded-none focus:outline-none focus:border-[#E11D48]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
                                Jenjang
                              </label>
                              <select
                                value={quickLevel}
                                onChange={(e) => setQuickLevel(e.target.value as EducationLevel)}
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
                                Peserta (Maks {slot.session.maxCapacity})
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={slot.session.maxCapacity}
                                required
                                value={quickParticipants}
                                onChange={(e) => setQuickParticipants(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#111111] rounded-none tabular-nums focus:outline-none focus:border-[#E11D48]"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
                                Nama PIC
                              </label>
                              <input
                                type="text"
                                required
                                value={quickPicName}
                                onChange={(e) => setQuickPicName(e.target.value)}
                                placeholder="Nama guru/PIC"
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
                                value={quickPicPhone}
                                onChange={(e) => setQuickPicPhone(e.target.value)}
                                placeholder="0812..."
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#111111] rounded-none tabular-nums focus:outline-none focus:border-[#E11D48]"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="submit"
                              className="flex-1 px-3 py-1.5 text-[11px] font-mono uppercase font-bold text-white bg-[#111111] hover:bg-[#E11D48] rounded-none cursor-pointer transition-colors"
                            >
                              Kunci Slot (Keep)
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickSessionId(null)}
                              className="px-3 py-1.5 text-[11px] font-mono uppercase font-bold text-[#111111] bg-white border border-[#111111] hover:bg-neutral-100 rounded-none cursor-pointer transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {slot.booking && (
                    <div className="space-y-2.5 pt-2 border-t border-neutral-200 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-[#111111] tabular-nums">
                          {slot.booking.bookingCode}
                        </span>
                        <span className="font-mono text-neutral-500 tabular-nums">
                          {slot.booking.plannedParticipants} peserta
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#111111]">
                          {slot.booking.institutionName}
                        </p>
                        <p className="text-neutral-500 mt-0.5">
                          {slot.booking.educationLevel} · {slot.booking.activityFocus}
                        </p>
                      </div>
                      <p className="text-neutral-600">
                        PIC: <span className="font-medium text-[#111111]">{slot.booking.picName}</span>{' '}
                        · Status: {BOOKING_STATUS_LABELS[slot.booking.status]}
                      </p>
                      {slot.booking.status === BookingStatus.KEEP && (
                        <p className="text-amber-900 bg-amber-50 border border-amber-500 rounded-none px-2.5 py-1.5 tabular-nums font-mono text-[11px]">
                          Batas unggah surat (H-3): {formatTanggalID(slot.booking.holdExpiresAt.slice(0, 10))}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {slot.booking.status === BookingStatus.KEEP && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = updateBookingStatus(
                                slot.booking!.id,
                                BookingStatus.BOOKED,
                                'Disetujui melalui panel inspeksi slot.'
                              );
                              setActionFeedback({
                                type: res.ok ? 'success' : 'error',
                                message: res.message,
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-mono uppercase font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-none cursor-pointer transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Setujui (Booked)</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSimulateConflict(slot)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-mono uppercase font-bold text-[#E11D48] bg-white border border-[#E11D48] hover:bg-rose-50 rounded-none cursor-pointer transition-colors"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Uji Anti-Bentrok</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const res = updateBookingStatus(
                              slot.booking!.id,
                              BookingStatus.CANCELLED,
                              'Slot dilepas kembali menjadi Tersedia.'
                            );
                            setActionFeedback({
                              type: res.ok ? 'success' : 'error',
                              message: `${res.message} Slot kini kembali Hijau (Tersedia).`,
                            });
                          }}
                          className="px-2.5 py-1.5 text-[11px] font-mono uppercase font-bold text-[#111111] bg-white border border-[#111111] hover:bg-neutral-100 rounded-none cursor-pointer transition-colors"
                        >
                          Lepas Slot
                        </button>
                      </div>
                    </div>
                  )}

                  {slot.status === SlotStatus.HOLIDAY && !slot.booking && (
                    <p className="text-xs text-neutral-600 pt-1 border-t border-neutral-200 leading-relaxed">
                      Alasan tutup: <span className="font-medium text-[#111111]">{slot.statusReason}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-neutral-200 text-xs text-neutral-500">
            Total transaksi tercatat dalam state:{' '}
            <span className="font-mono font-bold text-[#111111] tabular-nums">
              {state.bookings.length}
            </span>{' '}
            record.
          </div>
        </div>
      </div>
    </div>
  );
};
