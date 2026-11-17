import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  RotateCcw,
  Users,
} from 'lucide-react';
import { SLOT_STATUS_CONFIG } from '../../config/sirkusConfig';
import { DEFAULT_CALENDAR_FOCUS, useSirkus } from '../../context/SirkusContext';
import { BookingStatus, SlotResolution, SlotStatus } from '../../types/sirkus';
import {
  buildCalendarMonthGrid,
  formatBulanTahunID,
  formatHariTanggalID,
  parseISODateLocal,
  toISODateLocal,
} from '../../utils/bookingUtils';
import { StatusIcon, StatusIndicator } from '../StatusIndicator';

interface PublicCalendarViewProps {
  onSelectSlotToBook: (dateISO: string, sessionId: string) => void;
  onGoToCheckStatus: (bookingCode?: string) => void;
}

const WEEKDAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const PublicCalendarView: React.FC<PublicCalendarViewProps> = ({
  onSelectSlotToBook,
  onGoToCheckStatus,
}) => {
  const { getDaySlots, getMonthlySummary } = useSirkus();

  const [viewMode, setViewMode] = useState<'bulanan' | 'mingguan'>('bulanan');
  const [viewYear, setViewYear] = useState(DEFAULT_CALENDAR_FOCUS.year);
  const [viewMonth, setViewMonth] = useState(DEFAULT_CALENDAR_FOCUS.monthIndex);
  const [selectedDateISO, setSelectedDateISO] = useState(DEFAULT_CALENDAR_FOCUS.todayISO);

  const gridCells = useMemo(
    () => buildCalendarMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const weekDays = useMemo(() => {
    const base = parseISODateLocal(selectedDateISO);
    const mondayOffset = (base.getDay() + 6) % 7;
    const monday = new Date(base);
    monday.setDate(base.getDate() - mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return toISODateLocal(d);
    });
  }, [selectedDateISO]);

  const monthlySummary = useMemo(
    () => getMonthlySummary(viewYear, viewMonth),
    [getMonthlySummary, viewYear, viewMonth]
  );

  const todaySlots = useMemo(
    () => getDaySlots(DEFAULT_CALENDAR_FOCUS.todayISO),
    [getDaySlots]
  );

  const selectedDaySlots = useMemo(
    () => getDaySlots(selectedDateISO),
    [getDaySlots, selectedDateISO]
  );

  const sesi1Slot = selectedDaySlots[0];
  const sesi2Slot = selectedDaySlots[1];
  const showSesi2Recommendation =
    sesi1Slot &&
    sesi2Slot &&
    (sesi1Slot.status === SlotStatus.BOOKED || sesi1Slot.status === SlotStatus.KEEP) &&
    sesi2Slot.status === SlotStatus.AVAILABLE;

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
  };

  const renderPublicSlotPrivacyInfo = (slot: SlotResolution) => {
    if (slot.status === SlotStatus.AVAILABLE) {
      return (
        <p className="text-xs text-neutral-600 leading-relaxed">
          Slot terbuka untuk 1 rombongan dengan kapasitas maksimal{' '}
          <span className="font-semibold text-[#111111] tabular-nums">
            {slot.session.maxCapacity} peserta
          </span>
          .
        </p>
      );
    }

    if (slot.status === SlotStatus.HOLIDAY) {
      return (
        <p className="text-xs text-neutral-600 leading-relaxed">
          Keterangan: <span className="font-medium text-[#111111]">{slot.statusReason}</span>
        </p>
      );
    }

    if (slot.booking) {
      const isApproved =
        slot.booking.status === BookingStatus.BOOKED ||
        slot.booking.status === BookingStatus.COMPLETED;

      return (
        <div className="space-y-1 text-xs">
          <p className="text-neutral-700">
            {isApproved ? (
              <>
                Terisi oleh{' '}
                <span className="font-semibold text-[#111111]">
                  {slot.booking.institutionName}
                </span>
              </>
            ) : (
              <span className="font-medium text-amber-900">
                Sedang dikunci sementara (Keep) menunggu kelengkapan & verifikasi surat.
              </span>
            )}
          </p>
          <p className="text-neutral-500">
            {slot.booking.educationLevel} · {slot.booking.activityFocus}
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Operational Today Strip + Monthly Public KPI */}
      <div className="bg-white border border-neutral-200 p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] font-bold text-[#111111]">
            <CalendarDays className="w-4 h-4" aria-hidden="true" />
            <span>Hari Ini ({formatHariTanggalID(DEFAULT_CALENDAR_FOCUS.todayISO)}):</span>
          </span>
          {todaySlots.map((slot, idx) => {
            const meta = SLOT_STATUS_CONFIG[slot.status];
            return (
              <span key={slot.session.id} className="text-neutral-700">
                <span className="font-mono font-bold">Kelompok {idx + 1}</span>:{' '}
                <span className={`font-semibold ${meta.textClass}`}>
                  {slot.status === SlotStatus.BOOKED && slot.booking
                    ? `Terisi (${slot.booking.institutionName})`
                    : meta.label}
                </span>
                {idx === 0 && <span className="text-neutral-300 ml-3" aria-hidden="true">|</span>}
              </span>
            );
          })}
        </div>

        <div className="flex items-center gap-5 text-xs text-neutral-600 tabular-nums shrink-0">
          <span className="font-mono text-[11px]">
            Kosong Bulan Ini:{' '}
            <strong className="text-emerald-700">{monthlySummary.availableCount}</strong> /{' '}
            {monthlySummary.totalWorkingSlots} kelompok
          </span>
          <button
            type="button"
            onClick={() => onGoToCheckStatus()}
            className="font-mono text-[11px] uppercase tracking-[0.08em] font-bold text-[#111111] hover:text-[#E11D48] underline underline-offset-4 whitespace-nowrap cursor-pointer"
          >
            Cek Status Kode Booking
          </button>
        </div>
      </div>

      {/* Main 2-Column Public Calendar + Slot Aside (Variation 1 Asymmetric Split) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 bg-white border border-[#111111] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-[#111111]">
            <div>
              <h2 className="text-base font-display font-bold tracking-tight text-[#111111]">
                Kalender Ketersediaan — {formatBulanTahunID(viewYear, viewMonth)}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Pilih tanggal untuk memeriksa detail Kelompok Kunjung 1 dan Kelompok Kunjung 2 (08.00–12.00 WIB).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* View mode segmented buttons */}
              <div className="flex items-center border border-[#111111]">
                <button
                  type="button"
                  onClick={() => setViewMode('bulanan')}
                  className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors cursor-pointer ${
                    viewMode === 'bulanan'
                      ? 'bg-[#111111] text-white font-bold'
                      : 'bg-white text-neutral-600 hover:text-[#111111]'
                  }`}
                >
                  Bulanan
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('mingguan')}
                  className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] border-l border-[#111111] transition-colors cursor-pointer ${
                    viewMode === 'mingguan'
                      ? 'bg-[#111111] text-white font-bold'
                      : 'bg-white text-neutral-600 hover:text-[#111111]'
                  }`}
                >
                  Mingguan
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetToday}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[#111111] bg-white border border-neutral-300 hover:border-[#111111] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Hari Ini</span>
              </button>

              <div className="flex items-center border border-neutral-300">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Bulan sebelumnya"
                  className="p-2 text-neutral-700 hover:bg-neutral-100 hover:text-[#111111] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#111111] border-x border-neutral-300 py-2 whitespace-nowrap tabular-nums">
                  {formatBulanTahunID(viewYear, viewMonth)}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Bulan berikutnya"
                  className="p-2 text-neutral-700 hover:bg-neutral-100 hover:text-[#111111] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'bulanan' ? (
            <>
              <div className="grid grid-cols-7 border-b border-[#111111] bg-neutral-50">
                {WEEKDAY_HEADERS.map((day) => (
                  <div
                    key={day}
                    className="py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.12em] font-bold text-neutral-600 border-r last:border-r-0 border-neutral-200"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {gridCells.map((cell) => {
                  const slots = getDaySlots(cell.dateISO);
                  const isSelected = cell.dateISO === selectedDateISO;
                  const isToday = cell.dateISO === DEFAULT_CALENDAR_FOCUS.todayISO;

                  return (
                    <button
                      key={cell.dateISO}
                      type="button"
                      onClick={() => setSelectedDateISO(cell.dateISO)}
                      className={`min-h-[104px] p-2.5 text-left border-b border-r border-neutral-200 transition-colors flex flex-col justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E11D48] ${
                        isSelected
                          ? 'bg-[#111111] text-white'
                          : !cell.isCurrentMonth
                          ? 'bg-neutral-50/70 opacity-50 hover:opacity-80'
                          : 'bg-white hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`font-mono text-xs font-bold tabular-nums px-1.5 py-0.5 ${
                            isSelected
                              ? 'text-white'
                              : isToday
                              ? 'bg-[#E11D48] text-white'
                              : 'text-[#111111]'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>
                        {isToday && (
                          <span
                            className={`font-mono text-[9px] uppercase tracking-[0.1em] font-bold whitespace-nowrap ${
                              isSelected ? 'text-rose-300' : 'text-[#E11D48]'
                            }`}
                          >
                            Hari ini
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1 w-full">
                        {slots.map((slot, idx) => {
                          const meta = SLOT_STATUS_CONFIG[slot.status];
                          const selectedTagClass =
                            slot.status === SlotStatus.AVAILABLE
                              ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-200'
                              : slot.status === SlotStatus.KEEP
                              ? 'bg-amber-950/80 border-amber-400/50 text-amber-200'
                              : slot.status === SlotStatus.BOOKED
                              ? 'bg-[#E11D48] border-[#E11D48] text-white'
                              : 'bg-neutral-800 border-neutral-600 text-neutral-300';

                          return (
                            <div
                              key={slot.session.id}
                              className={`flex items-center justify-between gap-1 px-1.5 py-1 border text-[10px] leading-none font-mono ${
                                isSelected ? selectedTagClass : meta.cellClass
                              }`}
                            >
                              <span className="font-bold tabular-nums shrink-0">K{idx + 1}</span>
                              <span className="inline-flex items-center gap-1 truncate font-medium">
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
            </>
          ) : (
            /* Weekly Detailed View */
            <div className="divide-y divide-neutral-200">
              {weekDays.map((dISO) => {
                const slots = getDaySlots(dISO);
                const isSelected = dISO === selectedDateISO;
                return (
                  <div
                    key={dISO}
                    onClick={() => setSelectedDateISO(dISO)}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="min-w-[190px]">
                      <p className="text-sm font-display font-bold text-[#111111]">
                        {formatHariTanggalID(dISO)}
                      </p>
                      <p className="font-mono text-[11px] text-neutral-500 tabular-nums mt-0.5">
                        08.00 – 12.00 WIB
                      </p>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {slots.map((slot) => {
                        const meta = SLOT_STATUS_CONFIG[slot.status];
                        return (
                          <div
                            key={slot.session.id}
                            className={`p-3 border flex items-center justify-between gap-2 ${meta.cellClass}`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">
                                {slot.session.sessionName}
                              </p>
                              <p className="text-[11px] font-mono opacity-80 tabular-nums">
                                {slot.session.startTime}–{slot.session.endTime} WIB
                              </p>
                            </div>
                            {slot.status === SlotStatus.AVAILABLE ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectSlotToBook(dISO, slot.session.id);
                                }}
                                className="px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] whitespace-nowrap cursor-pointer shrink-0"
                              >
                                Pesan
                              </button>
                            ) : (
                              <StatusIndicator status={slot.status} compact />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Date Aside Panel (Variation 1 Editorial Aside) */}
        <aside className="xl:col-span-4 xl:border-l xl:border-neutral-200 xl:pl-8 space-y-6">
          <div className="pb-4 border-b-2 border-[#111111]">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-500">
              Status Kelompok Kunjung
            </p>
            <h3 className="mt-1.5 text-xl font-display font-extrabold tracking-tight text-[#111111]">
              {formatHariTanggalID(selectedDateISO)}
            </h3>
            <p className="mt-1 font-mono text-[11px] text-neutral-500 tabular-nums">
              2 Kelompok Kunjung / Hari · Maks. 1 Rombongan / Kelompok
            </p>
          </div>

          {showSesi2Recommendation && (
            <div className="p-3.5 border border-[#111111] bg-neutral-50 text-xs text-[#111111] flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#E11D48]" aria-hidden="true" />
              <span>
                <strong>Rekomendasi Jadwal:</strong> Kelompok Kunjung 1 telah terisi pada tanggal ini, namun{' '}
                <strong>Kelompok Kunjung 2 (08.00–12.00 WIB)</strong> masih tersedia.
              </span>
            </div>
          )}

          <div className="divide-y divide-neutral-200 border-b border-neutral-200">
            {selectedDaySlots.map((slot) => (
              <div key={slot.session.id} className="py-5 first:pt-0 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-[#111111]">
                      {slot.session.sessionName}
                    </p>
                    <p className="text-xs text-neutral-500 inline-flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      <span>{slot.session.timeLabel}</span>
                    </p>
                  </div>
                  <StatusIndicator status={slot.status} />
                </div>

                {renderPublicSlotPrivacyInfo(slot)}

                {slot.status === SlotStatus.AVAILABLE ? (
                  <button
                    type="button"
                    onClick={() => onSelectSlotToBook(selectedDateISO, slot.session.id)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] rounded-none transition-colors cursor-pointer"
                  >
                    <span>Ajukan ({slot.session.sessionName})</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500">
                    <Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Slot terkunci (anti-bentrok aktif).</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};
