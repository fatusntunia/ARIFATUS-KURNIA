import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Info,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import {
  ACTIVITY_FOCUS_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  INSTITUTION_INFO,
  SLOT_STATUS_CONFIG,
} from '../../config/sirkusConfig';
import { DEFAULT_CALENDAR_FOCUS, useSirkus } from '../../context/SirkusContext';
import {
  ActivityFocus,
  EducationLevel,
  SlotStatus,
  VisitBooking,
} from '../../types/sirkus';
import { formatHariTanggalID, formatTanggalID } from '../../utils/bookingUtils';
import { StatusIndicator } from '../StatusIndicator';

interface PublicBookingFormViewProps {
  initialDateISO?: string;
  initialSessionId?: string;
  onBackToCalendar: () => void;
  onTrackBookingCode: (bookingCode: string) => void;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export const PublicBookingFormView: React.FC<PublicBookingFormViewProps> = ({
  initialDateISO,
  initialSessionId,
  onBackToCalendar,
  onTrackBookingCode,
}) => {
  const { state, getDaySlots, createBooking } = useSirkus();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [visitDate, setVisitDate] = useState(
    initialDateISO || DEFAULT_CALENDAR_FOCUS.todayISO
  );
  const [sessionId, setSessionId] = useState(
    initialSessionId || state.sessions[0]?.id || 'sesi-1'
  );
  const [institutionName, setInstitutionName] = useState('');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(EducationLevel.SD);
  const [institutionAddress, setInstitutionAddress] = useState('');
  const [plannedParticipants, setPlannedParticipants] = useState<number>(30);
  const [activityFocus, setActivityFocus] = useState<ActivityFocus>(ActivityFocus.DONGENG);
  const [picName, setPicName] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [picEmail, setPicEmail] = useState('');

  // File upload simulation state
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Submission result state
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<VisitBooking | null>(null);

  const daySlots = useMemo(() => getDaySlots(visitDate), [getDaySlots, visitDate]);
  const selectedSlot = useMemo(
    () => daySlots.find((s) => s.session.id === sessionId) ?? daySlots[0],
    [daySlots, sessionId]
  );

  const alternativeSlot = useMemo(
    () => daySlots.find((s) => s.session.id !== sessionId && s.status === SlotStatus.AVAILABLE),
    [daySlots, sessionId]
  );

  const isSelectedSlotLocked = selectedSlot ? selectedSlot.status !== SlotStatus.AVAILABLE : false;
  const maxAllowed = selectedSlot?.session.maxCapacity ?? INSTITUTION_INFO.defaultMaxCapacity;
  const idealZoneLimit = selectedSlot?.session.idealZoneCapacity ?? 35;
  const isOverIdealZone = plannedParticipants > idealZoneLimit && plannedParticipants <= maxAllowed;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    const validExt = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
    if (!validExt) {
      setFileError('Format berkas tidak didukung. Unggah surat dalam format PDF, JPG, atau PNG.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError('Ukuran berkas melebihi batas maksimal 5 MB.');
      return;
    }

    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type || 'application/pdf',
    });
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const res = createBooking({
      institutionName,
      educationLevel,
      institutionAddress,
      picName,
      picPhone,
      picEmail,
      visitDate,
      sessionId,
      plannedParticipants: Number(plannedParticipants),
      activityFocus,
      letterFileName: selectedFile?.name,
      letterFileSize: selectedFile?.size,
      letterMimeType: selectedFile?.type,
      source: 'online',
    });

    if (!res.ok || !res.data) {
      setSubmitError(res.message);
      return;
    }

    setCreatedBooking(res.data);
  };

  if (createdBooking) {
    const bookedSession = state.sessions.find((s) => s.id === createdBooking.sessionId);
    return (
      <div className="max-w-3xl mx-auto bg-white border border-[#111111] p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-4 pb-5 border-b border-neutral-200">
          <div className="p-2.5 border border-emerald-700 bg-emerald-50 text-emerald-700 shrink-0">
            <ShieldCheck className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] font-bold text-emerald-700">
              Slot Berhasil Dikunci (Anti-Bentrok Terverifikasi)
            </p>
            <h2 className="text-xl font-display font-extrabold text-[#111111]">
              Pengajuan Reservasi Kunjungan Diterima
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Simpan kode booking di bawah ini untuk memantau proses verifikasi surat oleh admin serta mengunduh e-Ticket QR Code Anda.
            </p>
          </div>
        </div>

        <div className="bg-neutral-50 border border-[#111111] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500">
              Kode Booking Unik Anda
            </p>
            <p className="mt-1 text-2xl font-mono font-bold tracking-tight text-[#111111] tabular-nums">
              {createdBooking.bookingCode}
            </p>
          </div>
          <StatusIndicator status={SlotStatus.KEEP} showColorName />
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-y border-neutral-200 py-5">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-500">
              Instansi / Sekolah
            </dt>
            <dd className="mt-1 font-semibold text-[#111111]">
              {createdBooking.institutionName} ({createdBooking.educationLevel})
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-500">
              Jadwal & Sesi Kunjungan
            </dt>
            <dd className="mt-1 font-semibold text-[#111111] tabular-nums">
              {formatHariTanggalID(createdBooking.visitDate)} · {bookedSession?.sessionName} (
              {bookedSession?.timeLabel})
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-500">
              Estimasi Peserta & Fokus
            </dt>
            <dd className="mt-1 font-semibold text-[#111111] tabular-nums">
              {createdBooking.plannedParticipants} peserta · {createdBooking.activityFocus}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-500">
              Status Berkas Surat Permohonan
            </dt>
            <dd className="mt-1 font-semibold text-[#111111]">
              {createdBooking.letterFileName ? (
                <span className="text-emerald-700">
                  Terunggah: {createdBooking.letterFileName}
                </span>
              ) : (
                <span className="text-amber-800">
                  Belum diunggah — Batas maksimal {formatTanggalID(createdBooking.holdExpiresAt.slice(0, 10))} (H-3)
                </span>
              )}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToCalendar}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] font-bold text-[#111111] bg-white border border-[#111111] hover:bg-neutral-100 rounded-none cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Kembali ke Kalender</span>
          </button>

          <button
            type="button"
            onClick={() => onTrackBookingCode(createdBooking.bookingCode)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] rounded-none cursor-pointer"
          >
            <span>Lihat Status & Tiket QR</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="xl:col-span-8 bg-white border border-[#111111] p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b-2 border-[#111111]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-500">
              Formulir Pendaftaran Daring
            </p>
            <h2 className="text-xl font-display font-extrabold tracking-tight text-[#111111] mt-0.5">
              Ajukan Reservasi Kunjungan Wisata Baca
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Lengkapi data rombongan dan pilih sesi yang berstatus Hijau (Tersedia).
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToCalendar}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.08em] font-bold text-[#111111] bg-white border border-neutral-300 hover:border-[#111111] rounded-none cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Lihat Kalender</span>
          </button>
        </div>

        {/* Bagian 1: Tanggal & Pilihan Sesi (Anti-Bentrok Langsung) */}
        <div className="space-y-4">
          <h3 className="font-mono text-xs uppercase tracking-[0.1em] font-bold text-[#111111]">
            01. Pilihan Tanggal & Kelompok Kunjung ({INSTITUTION_INFO.operationalHours})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div>
              <label htmlFor="visitDate" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Tanggal Kunjungan *
              </label>
              <input
                id="visitDate"
                type="date"
                required
                min={DEFAULT_CALENDAR_FOCUS.todayISO}
                value={visitDate}
                onChange={(e) => {
                  setVisitDate(e.target.value);
                  setSubmitError(null);
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-none tabular-nums focus:outline-none focus:border-[#111111]"
              />
              <p className="font-mono text-[11px] text-neutral-500 mt-1.5">
                {formatHariTanggalID(visitDate)}
              </p>
            </div>

            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {daySlots.map((slot) => {
                const isSelected = slot.session.id === sessionId;
                const meta = SLOT_STATUS_CONFIG[slot.status];
                const disabledLook = slot.status !== SlotStatus.AVAILABLE;

                return (
                  <button
                    key={slot.session.id}
                    type="button"
                    onClick={() => {
                      setSessionId(slot.session.id);
                      setSubmitError(null);
                    }}
                    className={`p-4 rounded-none border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#111111] ring-1 ring-[#111111] bg-neutral-50'
                        : 'border-neutral-200 bg-white hover:border-neutral-400'
                    } ${disabledLook ? 'opacity-80' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-display font-bold text-[#111111]">
                        {slot.session.sessionName}
                      </span>
                      <StatusIndicator status={slot.status} compact />
                    </div>
                    <p className="mt-1 text-xs font-mono text-neutral-600 tabular-nums">
                      {slot.session.timeLabel}
                    </p>
                    <p className={`mt-1.5 text-[11px] font-medium ${meta.textClass}`}>
                      {slot.status === SlotStatus.AVAILABLE
                        ? `Tersedia · Maks. ${slot.session.maxCapacity} peserta`
                        : slot.status === SlotStatus.HOLIDAY
                        ? 'Layanan tutup / hari libur'
                        : 'Sudah dikunci rombongan lain'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conflict Pre-Warning */}
          {isSelectedSlotLocked && selectedSlot && (
            <div
              role="alert"
              className="p-3.5 rounded-none bg-rose-50 border border-[#E11D48] text-xs text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#E11D48]" aria-hidden="true" />
                <div>
                  <p className="font-semibold">
                    Deteksi Bentrok: {selectedSlot.session.sessionName} pada{' '}
                    {formatTanggalID(visitDate)} tidak tersedia.
                  </p>
                  <p className="mt-0.5 text-rose-900">
                    {selectedSlot.status === SlotStatus.HOLIDAY
                      ? selectedSlot.statusReason
                      : 'Satu kelompok kunjung hanya dapat dipesan oleh satu rombongan utama untuk mencegah penumpukan pengunjung.'}
                  </p>
                </div>
              </div>

              {alternativeSlot && (
                <button
                  type="button"
                  onClick={() => setSessionId(alternativeSlot.session.id)}
                  className="px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.08em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] rounded-none whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Pindah ke {alternativeSlot.session.sessionName}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bagian 2: Data Rombongan & PIC */}
        <div className="space-y-4 pt-5 border-t border-neutral-200">
          <h3 className="font-mono text-xs uppercase tracking-[0.1em] font-bold text-[#111111]">
            02. Identitas Sekolah / Instansi & Kontak PIC
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="institutionName" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Nama Sekolah / Instansi / Komunitas *
              </label>
              <input
                id="institutionName"
                type="text"
                required
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="Misal: SDN 04 Menteng / PAUD Tunas Bangsa"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label htmlFor="educationLevel" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Jenjang Pendidikan / Kategori *
              </label>
              <select
                id="educationLevel"
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

            <div className="sm:col-span-2">
              <label htmlFor="institutionAddress" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Alamat Instansi / Sekolah *
              </label>
              <input
                id="institutionAddress"
                type="text"
                required
                value={institutionAddress}
                onChange={(e) => setInstitutionAddress(e.target.value)}
                placeholder="Jalan, Kecamatan, Kota/Kabupaten"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label htmlFor="plannedParticipants" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Estimasi Jumlah Peserta (Anak + Pendamping) *
              </label>
              <input
                id="plannedParticipants"
                type="number"
                required
                min={1}
                max={maxAllowed}
                value={plannedParticipants}
                onChange={(e) => setPlannedParticipants(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-none tabular-nums focus:outline-none focus:border-[#111111]"
              />
              <p className="text-[11px] text-neutral-500 mt-1 tabular-nums">
                Kapasitas sesi maksimal {maxAllowed} orang.
              </p>
            </div>

            <div>
              <label htmlFor="activityFocus" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Fokus Kegiatan Wisata Baca *
              </label>
              <select
                id="activityFocus"
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
              <label htmlFor="picName" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Nama Lengkap Guru / PIC Rombongan *
              </label>
              <input
                id="picName"
                type="text"
                required
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder="Nama penanggung jawab"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="picPhone" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  No. WhatsApp PIC *
                </label>
                <input
                  id="picPhone"
                  type="tel"
                  required
                  value={picPhone}
                  onChange={(e) => setPicPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-none tabular-nums focus:outline-none focus:border-[#111111]"
                />
              </div>
              <div>
                <label htmlFor="picEmail" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Email PIC (Opsional)
                </label>
                <input
                  id="picEmail"
                  type="email"
                  value={picEmail}
                  onChange={(e) => setPicEmail(e.target.value)}
                  placeholder="nama@sekolah.id"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>
          </div>

          {isOverIdealZone && (
            <div className="p-3.5 rounded-none bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" aria-hidden="true" />
              <span>
                Jumlah peserta ({plannedParticipants} orang) melebihi kapasitas ideal satu zona ({idealZoneLimit} orang). Saat pelaksanaan, pustakawan akan membagi rombongan menjadi 2 sub-kelompok tur bergantian.
              </span>
            </div>
          )}
        </div>

        {/* Bagian 3: Simulasi Unggah Surat Permohonan */}
        <div className="space-y-3 pt-5 border-t border-neutral-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-mono text-xs uppercase tracking-[0.1em] font-bold text-[#111111]">
              03. Unggah Surat Permohonan Resmi
            </h3>
            <span className="font-mono text-[11px] text-neutral-500">
              Format: PDF, JPG, PNG · Maks. 5 MB
            </span>
          </div>

          {!selectedFile ? (
            <label className="flex flex-col items-center justify-center gap-2 p-6 border border-dashed border-neutral-400 rounded-none bg-neutral-50/70 hover:border-[#111111] hover:bg-neutral-100/70 transition-colors cursor-pointer text-center">
              <Upload className="w-5 h-5 text-[#111111]" aria-hidden="true" />
              <div className="text-xs">
                <span className="font-semibold text-[#111111] underline underline-offset-4">
                  Pilih file surat permohonan
                </span>{' '}
                <span className="text-neutral-600">dari perangkat Anda</span>
              </div>
              <p className="text-[11px] text-neutral-500 max-w-md">
                Jika surat belum siap hari ini, Anda tetap dapat mengunci slot (Keep) dan mengunggah surat paling lambat H-3 sebelum kunjungan.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          ) : (
            <div className="p-3.5 rounded-none border border-emerald-700 bg-emerald-50/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
                <div className="min-w-0 text-xs">
                  <p className="font-semibold text-[#111111] truncate">{selectedFile.name}</p>
                  <p className="text-neutral-600 tabular-nums">
                    {formatFileSize(selectedFile.size)} · Siap dikirim bersama pengajuan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                aria-label="Hapus berkas surat"
                className="p-1.5 text-neutral-500 hover:text-[#E11D48] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {fileError && (
            <p className="text-xs text-[#E11D48] font-semibold">{fileError}</p>
          )}
        </div>

        {submitError && (
          <div
            role="alert"
            className="p-3.5 rounded-none bg-rose-50 border border-[#E11D48] text-xs text-rose-950 flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#E11D48]" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200">
          <p className="text-xs text-neutral-500">
            Dengan mengirim formulir, slot langsung dikunci atas nama instansi Anda.
          </p>
          <button
            type="submit"
            disabled={isSelectedSlotLocked}
            className={`inline-flex items-center justify-center gap-2 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] font-bold rounded-none transition-colors ${
              isSelectedSlotLocked
                ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                : 'bg-[#111111] hover:bg-[#E11D48] text-white cursor-pointer'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span>Ajukan & Kunci Slot</span>
          </button>
        </div>
      </form>

      {/* Right Summary Sidebar */}
      <aside className="xl:col-span-4 xl:border-l xl:border-neutral-200 xl:pl-8 space-y-5">
        <div className="pb-4 border-b-2 border-[#111111]">
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-500">
            Mekanisme Anti-Bentrok
          </p>
          <h3 className="text-lg font-display font-extrabold text-[#111111] mt-1">
            Ringkasan Aturan Penguncian Slot
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Sistem menjamin pembagian maksimal 2 kelompok kunjung per hari agar tidak terjadi penumpukan rombongan.
          </p>
        </div>

        <ul className="space-y-4 text-xs text-neutral-600 leading-relaxed">
          <li className="flex items-start gap-2.5">
            <span className="font-mono font-bold text-[#E11D48] shrink-0">01.</span>
            <span>
              <strong className="text-[#111111]">Status Keep (Kuning):</strong> Berlaku otomatis sesaat setelah formulir dikirim. Slot aman dari pemesan lain selama menunggu verifikasi admin.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-mono font-bold text-[#E11D48] shrink-0">02.</span>
            <span>
              <strong className="text-[#111111]">Batas Unggah Surat H-{INSTITUTION_INFO.autoReleaseDeadlineDays}:</strong> Jika belum mengunggah surat saat mendaftar, wajib melengkapi sebelum H-3 agar slot tidak dilepas otomatis.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-mono font-bold text-[#E11D48] shrink-0">03.</span>
            <span>
              <strong className="text-[#111111]">Status Booked (Merah) & QR:</strong> Setelah admin menyetujui surat permohonan, e-Ticket QR Code aktif dan siap dipindai di lobi perpustakaan.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-mono font-bold text-[#E11D48] shrink-0">04.</span>
            <span>
              <strong className="text-[#111111]">Perlindungan Data:</strong> Nomor WhatsApp dan surat permohonan hanya dapat diakses oleh petugas verifikator dinas, tidak ditampilkan di kalender publik.
            </span>
          </li>
        </ul>
      </aside>
    </div>
  );
};
