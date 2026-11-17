import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, PhoneCall, UserCheck, X } from 'lucide-react';
import {
  ACTIVITY_FOCUS_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  SLOT_STATUS_CONFIG,
} from '../../config/sirkusConfig';
import { DEFAULT_CALENDAR_FOCUS, useSirkus } from '../../context/SirkusContext';
import { LIBRARIAN_GUIDES } from '../../data/initialSeed';
import {
  ActivityFocus,
  BookingSource,
  BookingStatus,
  EducationLevel,
  SlotStatus,
} from '../../types/sirkus';
import { formatHariTanggalID } from '../../utils/bookingUtils';
import { StatusIndicator } from '../StatusIndicator';

interface ManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDateISO?: string;
}

export const ManualBookingModal: React.FC<ManualBookingModalProps> = ({
  isOpen,
  onClose,
  defaultDateISO,
}) => {
  const { state, getDaySlots, createBooking } = useSirkus();

  const [source, setSource] = useState<Exclude<BookingSource, 'online'>>('manual_telepon');
  const [visitDate, setVisitDate] = useState(defaultDateISO || DEFAULT_CALENDAR_FOCUS.todayISO);
  const [sessionId, setSessionId] = useState(state.sessions[1]?.id ?? 'sesi-2');
  const [initialStatus, setInitialStatus] = useState<BookingStatus.BOOKED | BookingStatus.KEEP>(
    BookingStatus.BOOKED
  );
  const [institutionName, setInstitutionName] = useState('');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(EducationLevel.SD);
  const [institutionAddress, setInstitutionAddress] = useState('');
  const [plannedParticipants, setPlannedParticipants] = useState<number>(35);
  const [activityFocus, setActivityFocus] = useState<ActivityFocus>(ActivityFocus.PAKET_LENGKAP);
  const [picName, setPicName] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [assignedGuide, setAssignedGuide] = useState(LIBRARIAN_GUIDES[0]);
  const [letterFileName, setLetterFileName] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    bookingCode?: string;
  } | null>(null);

  const daySlots = useMemo(() => getDaySlots(visitDate), [getDaySlots, visitDate]);
  const selectedSlot = daySlots.find((s) => s.session.id === sessionId) ?? daySlots[0];
  const isSlotBlocked = selectedSlot ? selectedSlot.status !== SlotStatus.AVAILABLE : false;
  const maxCap = selectedSlot?.session.maxCapacity ?? 60;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = createBooking({
      institutionName,
      educationLevel,
      institutionAddress: institutionAddress || 'Diinput melalui layanan internal dinas',
      picName,
      picPhone,
      picEmail: '-',
      visitDate,
      sessionId,
      plannedParticipants: Number(plannedParticipants),
      activityFocus,
      letterFileName: letterFileName.trim() || undefined,
      source,
      initialStatus,
      assignedGuide: initialStatus === BookingStatus.BOOKED ? assignedGuide : undefined,
      adminNote:
        adminNote.trim() ||
        (source === 'manual_walkin'
          ? 'Pendaftaran manual jalur Walk-in / datang langsung di meja layanan.'
          : 'Pendaftaran manual jalur Telepon / WhatsApp resmi dinas.'),
    });

    if (!res.ok || !res.data) {
      setFeedback({ type: 'error', message: res.message });
      return;
    }

    setFeedback({
      type: 'success',
      message: res.message,
      bookingCode: res.data.bookingCode,
    });
    setInstitutionName('');
    setInstitutionAddress('');
    setPicName('');
    setPicPhone('');
    setLetterFileName('');
    setAdminNote('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-booking-title"
    >
      <div className="bg-white border-2 border-[#111111] w-full max-w-2xl overflow-hidden my-auto">
        <div className="px-6 py-4 bg-[#111111] text-white flex items-center justify-between gap-4 border-b-2 border-[#E11D48]">
          <div>
            <h2 id="manual-booking-title" className="text-base font-display font-bold">
              Input Booking Manual (Telepon / Walk-in)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Pencatatan reservasi non-daring langsung ke kalender dengan proteksi anti-bentrok.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal input manual"
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Jalur & Status Awal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Jalur Pendaftaran
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSource('manual_telepon')}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-[11px] uppercase rounded-none border cursor-pointer ${
                    source === 'manual_telepon'
                      ? 'bg-[#111111] border-[#111111] text-white font-bold'
                      : 'bg-white border-neutral-300 text-neutral-700 hover:border-[#111111]'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Telepon</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSource('manual_walkin')}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-[11px] uppercase rounded-none border cursor-pointer ${
                    source === 'manual_walkin'
                      ? 'bg-[#111111] border-[#111111] text-white font-bold'
                      : 'bg-white border-neutral-300 text-neutral-700 hover:border-[#111111]'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Walk-in</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Status Penguncian Awal
              </label>
              <select
                value={initialStatus}
                onChange={(e) =>
                  setInitialStatus(e.target.value as BookingStatus.BOOKED | BookingStatus.KEEP)
                }
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-[#111111]"
              >
                <option value={BookingStatus.BOOKED}>Langsung Booked (Merah) — Terkonfirmasi</option>
                <option value={BookingStatus.KEEP}>Keep / Pending (Kuning) — Surat Menyusul</option>
              </select>
            </div>
          </div>

          {/* Tanggal & Pilihan 2 Sesi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start pt-3 border-t border-neutral-200">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Tanggal Kunjungan *
              </label>
              <input
                type="date"
                required
                value={visitDate}
                onChange={(e) => {
                  setVisitDate(e.target.value);
                  setFeedback(null);
                }}
                className="w-full px-2.5 py-2 text-xs bg-white border border-neutral-300 rounded-none tabular-nums focus:outline-none focus:border-[#111111]"
              />
              <p className="text-[11px] text-neutral-500 mt-1">{formatHariTanggalID(visitDate)}</p>
            </div>

            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {daySlots.map((slot) => {
                const isSelected = slot.session.id === sessionId;
                const meta = SLOT_STATUS_CONFIG[slot.status];
                return (
                  <button
                    key={slot.session.id}
                    type="button"
                    onClick={() => {
                      setSessionId(slot.session.id);
                      setFeedback(null);
                    }}
                    className={`p-3 rounded-none border text-left cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[#111111] ring-1 ring-[#111111] bg-neutral-50'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#111111]">
                        {slot.session.sessionName}
                      </span>
                      <StatusIndicator status={slot.status} compact />
                    </div>
                    <p className="text-[11px] font-mono text-neutral-600 mt-0.5 tabular-nums">
                      {slot.session.timeLabel}
                    </p>
                    <p className={`text-[11px] mt-1 ${meta.textClass}`}>
                      {slot.status === SlotStatus.AVAILABLE
                        ? 'Kosong & siap diisi'
                        : slot.booking
                        ? `Terisi: ${slot.booking.institutionName}`
                        : 'Libur / Tutup'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {isSlotBlocked && selectedSlot && (
            <div className="p-3 rounded-none bg-rose-50 border border-[#E11D48] text-xs text-rose-950 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#E11D48]" aria-hidden="true" />
              <span>{selectedSlot.statusReason}</span>
            </div>
          )}

          {/* Data Instansi & PIC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-neutral-200">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nama Sekolah / Instansi *
              </label>
              <input
                type="text"
                required
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="Misal: TK Harapan Ibu"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-none focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Jenjang Pendidikan *
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-[#111111]"
              >
                {EDUCATION_LEVEL_OPTIONS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Estimasi Peserta (Maks. {maxCap}) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={maxCap}
                value={plannedParticipants}
                onChange={(e) => setPlannedParticipants(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-none tabular-nums focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Fokus Kegiatan *
              </label>
              <select
                value={activityFocus}
                onChange={(e) => setActivityFocus(e.target.value as ActivityFocus)}
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-[#111111]"
              >
                {ACTIVITY_FOCUS_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nama PIC / Guru *
              </label>
              <input
                type="text"
                required
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder="Nama kontak"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-none focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                No. Telepon / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={picPhone}
                onChange={(e) => setPicPhone(e.target.value)}
                placeholder="0812..."
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-none tabular-nums focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nomor / Nama Surat Fisik (Opsional)
              </label>
              <input
                type="text"
                value={letterFileName}
                onChange={(e) => setLetterFileName(e.target.value)}
                placeholder="Misal: Surat_Fisik_No_124.pdf"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-none focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Pustakawan Pemandu
              </label>
              <select
                value={assignedGuide}
                onChange={(e) => setAssignedGuide(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-[#111111]"
              >
                {LIBRARIAN_GUIDES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Catatan Internal Admin (Opsional)
              </label>
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Keterangan tambahan dari telepon atau meja layanan..."
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-none focus:outline-none focus:border-[#111111]"
              />
            </div>
          </div>

          {feedback && (
            <div
              role="status"
              className={`p-3 rounded-none border text-xs flex items-start gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-700 text-emerald-900'
                  : 'bg-rose-50 border-[#E11D48] text-rose-950'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#E11D48]" />
              )}
              <div>
                <p>{feedback.message}</p>
                {feedback.bookingCode && (
                  <p className="mt-1 font-mono font-bold text-[#111111]">
                    Kode Booking Terbit: {feedback.bookingCode}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-mono text-[11px] uppercase font-bold text-[#111111] bg-white border border-neutral-300 hover:border-[#111111] rounded-none cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={isSlotBlocked}
              className={`px-4 py-2 font-mono text-[11px] uppercase font-bold rounded-none ${
                isSlotBlocked
                  ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                  : 'bg-[#111111] hover:bg-[#E11D48] text-white cursor-pointer'
              }`}
            >
              Simpan Booking Manual
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
