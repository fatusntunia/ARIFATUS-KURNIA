import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  Check,
  CheckCircle2,
  FileText,
  XCircle,
} from 'lucide-react';
import { BOOKING_STATUS_LABELS } from '../../config/sirkusConfig';
import { DEFAULT_CALENDAR_FOCUS, useSirkus } from '../../context/SirkusContext';
import { LIBRARIAN_GUIDES } from '../../data/initialSeed';
import { BookingStatus, SlotStatus, VisitBooking } from '../../types/sirkus';
import { formatTanggalID } from '../../utils/bookingUtils';
import { StatusIndicator } from '../StatusIndicator';

type QueueTab = 'pending' | 'active_booked' | 'processed';
type ActionModalMode = 'approve' | 'reject' | 'reschedule' | 'cancel';

export const VerificationQueueView: React.FC = () => {
  const { state, getDaySlots, updateBookingStatus, rescheduleBooking } = useSirkus();

  const [activeTab, setActiveTab] = useState<QueueTab>('pending');
  const [selectedBooking, setSelectedBooking] = useState<VisitBooking | null>(null);
  const [actionMode, setActionMode] = useState<ActionModalMode | null>(null);

  // Action modal form state
  const [noteInput, setNoteInput] = useState('');
  const [guideInput, setGuideInput] = useState(LIBRARIAN_GUIDES[0]);
  const [newDateISO, setNewDateISO] = useState(DEFAULT_CALENDAR_FOCUS.todayISO);
  const [newSessionId, setNewSessionId] = useState(state.sessions[0]?.id ?? 'sesi-1');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const pendingList = useMemo(
    () =>
      state.bookings.filter(
        (b) => b.status === BookingStatus.KEEP || b.status === BookingStatus.REVISION
      ),
    [state.bookings]
  );

  const activeBookedList = useMemo(
    () => state.bookings.filter((b) => b.status === BookingStatus.BOOKED),
    [state.bookings]
  );

  const processedList = useMemo(
    () =>
      state.bookings.filter(
        (b) =>
          b.status === BookingStatus.COMPLETED ||
          b.status === BookingStatus.REJECTED ||
          b.status === BookingStatus.CANCELLED ||
          b.status === BookingStatus.AUTO_RELEASED
      ),
    [state.bookings]
  );

  const displayedList =
    activeTab === 'pending'
      ? pendingList
      : activeTab === 'active_booked'
      ? activeBookedList
      : processedList;

  const targetDaySlots = useMemo(() => getDaySlots(newDateISO), [getDaySlots, newDateISO]);

  const openActionDialog = (booking: VisitBooking, mode: ActionModalMode) => {
    setSelectedBooking(booking);
    setActionMode(mode);
    setFeedback(null);
    setGuideInput(booking.assignedGuide || LIBRARIAN_GUIDES[0]);
    setNewDateISO(booking.visitDate);
    setNewSessionId(booking.sessionId);

    if (mode === 'approve') {
      setNoteInput('Surat permohonan terverifikasi dan kapasitas peserta sesuai.');
    } else if (mode === 'reject') {
      setNoteInput('Surat permohonan belum memenuhi persyaratan administrasi dinas.');
    } else if (mode === 'cancel') {
      setNoteInput('Reservasi dibatalkan oleh admin sesuai konfirmasi PIC.');
    } else {
      setNoteInput('Jadwal disesuaikan atas kesepakatan bersama PIC instansi.');
    }
  };

  const closeActionDialog = () => {
    setSelectedBooking(null);
    setActionMode(null);
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !actionMode) return;

    if (actionMode === 'approve') {
      const res = updateBookingStatus(
        selectedBooking.id,
        BookingStatus.BOOKED,
        noteInput,
        guideInput
      );
      setFeedback({
        type: res.ok ? 'success' : 'error',
        message: `${res.message} Slot kini berstatus Booked (Merah) dan e-Ticket QR aktif.`,
      });
      closeActionDialog();
      return;
    }

    if (actionMode === 'reject') {
      const res = updateBookingStatus(selectedBooking.id, BookingStatus.REJECTED, noteInput);
      setFeedback({
        type: res.ok ? 'success' : 'error',
        message: `${res.message} Slot dilepas kembali menjadi Tersedia (Hijau).`,
      });
      closeActionDialog();
      return;
    }

    if (actionMode === 'cancel') {
      const res = updateBookingStatus(selectedBooking.id, BookingStatus.CANCELLED, noteInput);
      setFeedback({
        type: res.ok ? 'success' : 'error',
        message: `${res.message} Slot dilepas kembali menjadi Tersedia (Hijau).`,
      });
      closeActionDialog();
      return;
    }

    if (actionMode === 'reschedule') {
      const res = rescheduleBooking(selectedBooking.id, newDateISO, newSessionId, noteInput);
      if (!res.ok) {
        setFeedback({ type: 'error', message: res.message });
        return;
      }
      setFeedback({ type: 'success', message: res.message });
      closeActionDialog();
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-[#111111] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#111111] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-display font-bold text-[#111111]">
              Antrean Verifikasi Surat & Persetujuan Jadwal
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Periksa kelengkapan surat permohonan dan lakukan Approve (Booked/Merah), Reject, Reschedule, atau Cancel.
            </p>
          </div>

          <div className="flex items-center border border-[#111111]">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-[#111111] text-white font-bold'
                  : 'bg-white text-neutral-600 hover:text-[#111111]'
              }`}
            >
              Antrean Keep ({pendingList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('active_booked')}
              className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] border-l border-[#111111] transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'active_booked'
                  ? 'bg-[#111111] text-white font-bold'
                  : 'bg-white text-neutral-600 hover:text-[#111111]'
              }`}
            >
              Booked Aktif ({activeBookedList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('processed')}
              className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] border-l border-[#111111] transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'processed'
                  ? 'bg-[#111111] text-white font-bold'
                  : 'bg-white text-neutral-600 hover:text-[#111111]'
              }`}
            >
              Riwayat ({processedList.length})
            </button>
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className={`mx-6 mt-4 p-3 rounded-none border text-xs flex items-start gap-2 ${
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
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-neutral-200 bg-neutral-50 font-mono text-[10px] uppercase tracking-[0.1em] font-bold text-neutral-600">
                <th className="py-3 px-4 whitespace-nowrap">Kode Booking</th>
                <th className="py-3 px-4">Instansi & Kontak PIC</th>
                <th className="py-3 px-4 whitespace-nowrap">Jadwal & Sesi</th>
                <th className="py-3 px-4">Berkas Surat Permohonan</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs">
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-neutral-500">
                    Tidak ada pengajuan pada kategori ini.
                  </td>
                </tr>
              ) : (
                displayedList.map((booking) => {
                  const session = state.sessions.find((s) => s.id === booking.sessionId);
                  const canApprove =
                    booking.status === BookingStatus.KEEP ||
                    booking.status === BookingStatus.REVISION;
                  const canModify =
                    canApprove || booking.status === BookingStatus.BOOKED;

                  return (
                    <tr key={booking.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <span className="font-mono font-bold text-[#111111] tabular-nums">
                          {booking.bookingCode}
                        </span>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {booking.source === 'online'
                            ? 'Via Online'
                            : booking.source === 'manual_telepon'
                            ? 'Via Telepon'
                            : 'Walk-in'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <p className="font-semibold text-[#111111]">{booking.institutionName}</p>
                        <p className="text-neutral-600 mt-0.5">
                          {booking.educationLevel} · <strong className="tabular-nums">{booking.plannedParticipants}</strong> peserta
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5 tabular-nums">
                          PIC: {booking.picName} · {booking.picPhone}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <p className="font-semibold text-[#111111] tabular-nums">
                          {formatTanggalID(booking.visitDate)}
                        </p>
                        <p className="font-mono text-[11px] text-neutral-600 tabular-nums mt-0.5">
                          {session?.sessionName} ({session?.timeLabel})
                        </p>
                        {booking.assignedGuide && (
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            Pemandu: {booking.assignedGuide}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        {booking.letterFileName ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800">
                              <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>{booking.letterFileName}</span>
                            </span>
                            <p className="text-[11px] text-neutral-500">
                              Berkas siap diperiksa admin
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 font-medium text-amber-800">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>Belum Unggah Surat</span>
                            </span>
                            <p className="text-[11px] text-neutral-500 tabular-nums">
                              Batas H-3: {formatTanggalID(booking.holdExpiresAt.slice(0, 10))}
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        {canApprove ? (
                          <StatusIndicator status={SlotStatus.KEEP} />
                        ) : booking.status === BookingStatus.BOOKED ? (
                          <StatusIndicator status={SlotStatus.BOOKED} />
                        ) : (
                          <span className="text-neutral-600 font-medium">
                            {BOOKING_STATUS_LABELS[booking.status]}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        {canModify ? (
                          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                            {canApprove && (
                              <button
                                type="button"
                                onClick={() => openActionDialog(booking, 'approve')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-none cursor-pointer"
                              >
                                <Check className="w-3 h-3" aria-hidden="true" />
                                <span>Approve</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openActionDialog(booking, 'reschedule')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] font-bold text-[#111111] bg-neutral-100 border border-[#111111] hover:bg-neutral-200 rounded-none cursor-pointer"
                            >
                              <CalendarClock className="w-3 h-3" aria-hidden="true" />
                              <span>Reschedule</span>
                            </button>
                            {canApprove && (
                              <button
                                type="button"
                                onClick={() => openActionDialog(booking, 'reject')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] font-bold text-[#E11D48] bg-white border border-[#E11D48] hover:bg-rose-50 rounded-none cursor-pointer"
                              >
                                <XCircle className="w-3 h-3" aria-hidden="true" />
                                <span>Reject</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openActionDialog(booking, 'cancel')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] font-bold text-neutral-700 bg-white border border-neutral-300 hover:border-[#111111] rounded-none cursor-pointer"
                            >
                              <Ban className="w-3 h-3" aria-hidden="true" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-neutral-400">Arsip final</span>
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

      {/* Action Modal (Approve / Reject / Reschedule / Cancel) */}
      {selectedBooking && actionMode && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border-2 border-[#111111] w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 bg-[#111111] text-white flex items-center justify-between border-b-2 border-[#E11D48]">
              <div>
                <h3 className="text-sm font-display font-bold">
                  {actionMode === 'approve' && 'Approve Reservasi -> Booked (Merah)'}
                  {actionMode === 'reject' && 'Tolak Pengajuan (Reject)'}
                  {actionMode === 'reschedule' && 'Jadwal Ulang Kunjungan (Reschedule)'}
                  {actionMode === 'cancel' && 'Batalkan Reservasi (Cancel)'}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                  {selectedBooking.bookingCode} · {selectedBooking.institutionName}
                </p>
              </div>
              <button
                type="button"
                onClick={closeActionDialog}
                className="font-mono text-[11px] uppercase text-neutral-300 hover:text-white cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="p-5 space-y-4 text-xs">
              {actionMode === 'approve' && (
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1.5">
                    Tugaskan Pustakawan Pemandu
                  </label>
                  <select
                    value={guideInput}
                    onChange={(e) => setGuideInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-[#111111]"
                  >
                    {LIBRARIAN_GUIDES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {actionMode === 'reschedule' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Tanggal Baru *
                    </label>
                    <input
                      type="date"
                      required
                      value={newDateISO}
                      onChange={(e) => setNewDateISO(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-none tabular-nums focus:outline-none focus:border-[#111111]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Pilih Sesi Baru (Cek Anti-Bentrok) *
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {targetDaySlots.map((slot) => {
                        const isCurrentOwnSlot =
                          slot.booking?.id === selectedBooking.id;
                        const isOccupiedByOther =
                          slot.status !== SlotStatus.AVAILABLE && !isCurrentOwnSlot;
                        const isSelected = newSessionId === slot.session.id;

                        return (
                          <button
                            key={slot.session.id}
                            type="button"
                            onClick={() => setNewSessionId(slot.session.id)}
                            className={`p-3 rounded-none border text-left cursor-pointer ${
                              isSelected
                                ? 'border-[#111111] ring-1 ring-[#111111] bg-neutral-50'
                                : 'border-neutral-200 hover:bg-neutral-50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-[#111111]">
                                {slot.session.sessionName}
                              </span>
                              <StatusIndicator status={slot.status} compact />
                            </div>
                            <p className="font-mono text-[11px] text-neutral-600 mt-0.5 tabular-nums">
                              {slot.session.timeLabel}
                            </p>
                            {isOccupiedByOther && (
                              <p className="text-[11px] text-[#E11D48] font-medium mt-1">
                                Bentrok / Tutup
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-1.5">
                  Catatan / Alasan Verifikasi (Terkirim ke Status Pemohon) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:outline-none focus:border-[#111111]"
                />
              </div>

              {feedback && feedback.type === 'error' && (
                <p className="p-2.5 border border-[#E11D48] bg-rose-50 text-rose-950">
                  {feedback.message}
                </p>
              )}

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeActionDialog}
                  className="px-4 py-2 font-mono text-[11px] uppercase font-bold text-[#111111] bg-white border border-neutral-300 hover:border-[#111111] rounded-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 font-mono text-[11px] uppercase font-bold text-white rounded-none cursor-pointer ${
                    actionMode === 'approve'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : actionMode === 'reject' || actionMode === 'cancel'
                      ? 'bg-[#E11D48] hover:bg-rose-700'
                      : 'bg-[#111111] hover:bg-[#E11D48]'
                  }`}
                >
                  {actionMode === 'approve' && 'Konfirmasi Approve'}
                  {actionMode === 'reject' && 'Konfirmasi Reject'}
                  {actionMode === 'reschedule' && 'Simpan Jadwal Baru'}
                  {actionMode === 'cancel' && 'Konfirmasi Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
