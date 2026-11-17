import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Printer,
  QrCode,
  Search,
  Upload,
} from 'lucide-react';
import { BOOKING_STATUS_LABELS, INSTITUTION_INFO } from '../../config/sirkusConfig';
import { useSirkus } from '../../context/SirkusContext';
import { BookingStatus, SlotStatus, VisitBooking } from '../../types/sirkus';
import { formatHariTanggalID, formatTanggalID } from '../../utils/bookingUtils';
import { StatusIndicator } from '../StatusIndicator';

interface PublicTicketCheckViewProps {
  initialBookingCode?: string;
  onGoToBooking: () => void;
}

const SAMPLE_CODES = [
  { code: 'SB-261117-S1-2081', note: 'Booked (QR Aktif)' },
  { code: 'SB-261118-S2-4190', note: 'Keep (Belum Unggah Surat)' },
  { code: 'SB-261120-S1-6174', note: 'Keep (Menunggu Verifikasi)' },
];

export const PublicTicketCheckView: React.FC<PublicTicketCheckViewProps> = ({
  initialBookingCode = '',
  onGoToBooking,
}) => {
  const { state, findBookingByCode, attachBookingLetter, updateBookingStatus } = useSirkus();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [queryCode, setQueryCode] = useState(initialBookingCode || 'SB-261117-S1-2081');
  const [searchedCode, setSearchedCode] = useState(initialBookingCode || 'SB-261117-S1-2081');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (initialBookingCode) {
      setQueryCode(initialBookingCode);
      setSearchedCode(initialBookingCode);
      setUploadFeedback(null);
      setConfirmCancel(false);
    }
  }, [initialBookingCode]);

  const foundBooking: VisitBooking | undefined = findBookingByCode(searchedCode);
  const foundSession = foundBooking
    ? state.sessions.find((s) => s.id === foundBooking.sessionId)
    : undefined;

  useEffect(() => {
    let active = true;
    if (!foundBooking) {
      setQrDataUrl('');
      return;
    }

    const qrPayload = JSON.stringify({
      app: 'SIRKUS-BACA',
      code: foundBooking.bookingCode,
      institution: foundBooking.institutionName,
      date: foundBooking.visitDate,
      session: foundSession?.sessionCode ?? foundBooking.sessionId,
      participants: foundBooking.plannedParticipants,
      status: foundBooking.status,
    });

    QRCode.toDataURL(qrPayload, {
      width: 240,
      margin: 2,
      color: {
        dark: '#111111',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });

    return () => {
      active = false;
    };
  }, [foundBooking, foundSession]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedCode(queryCode.trim());
    setUploadFeedback(null);
    setConfirmCancel(false);
  };

  const handleUploadLetter = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!foundBooking) return;
    setUploadFeedback(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    const valid = ['.pdf', '.jpg', '.jpeg', '.png'].some((ext) => lower.endsWith(ext));
    if (!valid) {
      setUploadFeedback({
        type: 'error',
        message: 'Format file wajib PDF, JPG, atau PNG.',
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadFeedback({
        type: 'error',
        message: 'Ukuran file maksimal 5 MB.',
      });
      return;
    }

    const res = attachBookingLetter(foundBooking.id, file.name, file.size, file.type);
    setUploadFeedback({
      type: res.ok ? 'success' : 'error',
      message: res.message,
    });
  };

  const handleDownloadTicketPng = async () => {
    if (!foundBooking || !qrDataUrl) return;

    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#FDFDFD';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header band
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, 108);

    // Crimson accent bar
    ctx.fillStyle = '#E11D48';
    ctx.fillRect(0, 104, canvas.width, 4);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('e-TICKET KUNJUNGAN WISATA BACA', 40, 50);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#D4D4D4';
    ctx.fillText(
      `${INSTITUTION_INFO.appName} — ${INSTITUTION_INFO.agencyName}`,
      40,
      80
    );

    // Outer border
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    // Left details
    ctx.fillStyle = '#737373';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('KODE BOOKING', 40, 152);

    ctx.fillStyle = '#111111';
    ctx.font = 'bold 34px monospace';
    ctx.fillText(foundBooking.bookingCode, 40, 192);

    const drawField = (label: string, value: string, y: number) => {
      ctx.fillStyle = '#737373';
      ctx.font = '13px monospace';
      ctx.fillText(label, 40, y);
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(value, 40, y + 24);
    };

    drawField(
      'INSTANSI / SEKOLAH',
      `${foundBooking.institutionName} (${foundBooking.educationLevel})`,
      245
    );
    drawField(
      'JADWAL & SESI KUNJUNGAN',
      `${formatHariTanggalID(foundBooking.visitDate)} · ${foundSession?.sessionName ?? ''} (${foundSession?.timeLabel ?? ''})`,
      315
    );
    drawField(
      'ESTIMASI PESERTA & FOKUS',
      `${foundBooking.plannedParticipants} Peserta · ${foundBooking.activityFocus}`,
      385
    );
    drawField(
      'STATUS RESERVASI',
      BOOKING_STATUS_LABELS[foundBooking.status],
      455
    );

    // QR Code panel on right
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(640, 136, 280, 340);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(640, 136, 280, 340);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 670, 156, 220, 220);
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PINDAI QR SAAT CHECK-IN LOBI', 780, 412);
      ctx.fillStyle = '#737373';
      ctx.font = '12px sans-serif';
      ctx.fillText('Tunjukkan tiket kepada petugas', 780, 434);

      const link = document.createElement('a');
      link.download = `eTicket-${foundBooking.bookingCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = qrDataUrl;
  };

  const getSlotStatusForBadge = (status: BookingStatus): SlotStatus => {
    if (status === BookingStatus.BOOKED || status === BookingStatus.COMPLETED) {
      return SlotStatus.BOOKED;
    }
    if (status === BookingStatus.KEEP || status === BookingStatus.REVISION) {
      return SlotStatus.KEEP;
    }
    return SlotStatus.HOLIDAY;
  };

  const isTicketActive =
    foundBooking?.status === BookingStatus.BOOKED ||
    foundBooking?.status === BookingStatus.COMPLETED;

  const canSelfManage =
    foundBooking?.status === BookingStatus.KEEP ||
    foundBooking?.status === BookingStatus.REVISION;

  return (
    <div className="space-y-8">
      {/* Search Bar Box */}
      <section className="bg-white border border-[#111111] p-6 sm:p-8 space-y-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-500">
            Pelacakan Mandiri
          </p>
          <h2 className="text-xl font-display font-extrabold tracking-tight text-[#111111] mt-0.5">
            Cek Status Reservasi & Unduh e-Ticket QR
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Masukkan kode booking unik untuk memantau status verifikasi surat dan mengunduh tiket QR.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={queryCode}
              onChange={(e) => setQueryCode(e.target.value)}
              placeholder="Masukkan Kode Booking (contoh: SB-261117-S1-2081)"
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono bg-neutral-50 border border-neutral-300 rounded-none focus:bg-white focus:outline-none focus:border-[#111111]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] rounded-none whitespace-nowrap cursor-pointer"
          >
            Lacak Kode Booking
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-neutral-500 pt-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em]">Contoh Cepat:</span>
          {SAMPLE_CODES.map((sample) => (
            <button
              key={sample.code}
              type="button"
              onClick={() => {
                setQueryCode(sample.code);
                setSearchedCode(sample.code);
                setUploadFeedback(null);
                setConfirmCancel(false);
              }}
              className="font-mono text-xs font-bold text-[#111111] hover:text-[#E11D48] underline underline-offset-4 cursor-pointer"
            >
              {sample.code}{' '}
              <span className="font-sans font-normal text-neutral-500">({sample.note})</span>
            </button>
          ))}
        </div>
      </section>

      {/* Search Result */}
      {!foundBooking ? (
        <div className="bg-white border border-[#111111] p-10 text-center space-y-3">
          <QrCode className="w-8 h-8 text-neutral-400 mx-auto" aria-hidden="true" />
          <h3 className="text-sm font-display font-bold text-[#111111]">
            Kode Booking &ldquo;{searchedCode}&rdquo; Tidak Ditemukan
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Periksa kembali huruf dan angka kode booking Anda, atau ajukan reservasi kunjungan baru melalui kalender publik.
          </p>
          <button
            type="button"
            onClick={onGoToBooking}
            className="inline-flex items-center px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] rounded-none cursor-pointer"
          >
            Ajukan Kunjungan Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left: Tracking Progress & Details */}
          <div className="xl:col-span-7 bg-white border border-[#111111] p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b-2 border-[#111111]">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                  Kode Booking
                </p>
                <h3 className="text-2xl font-mono font-bold text-[#111111] tabular-nums mt-0.5">
                  {foundBooking.bookingCode}
                </h3>
              </div>
              <StatusIndicator status={getSlotStatusForBadge(foundBooking.status)} showColorName />
            </div>

            {/* 4-Step Verification Timeline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                {
                  step: '01',
                  title: 'Slot Dikunci',
                  done: true,
                },
                {
                  step: '02',
                  title: 'Surat Permohonan',
                  done: Boolean(foundBooking.letterFileName),
                },
                {
                  step: '03',
                  title: 'Verifikasi Admin',
                  done:
                    foundBooking.status === BookingStatus.BOOKED ||
                    foundBooking.status === BookingStatus.COMPLETED,
                },
                {
                  step: '04',
                  title: 'e-Ticket QR Aktif',
                  done: isTicketActive,
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`p-3 rounded-none border ${
                    item.done
                      ? 'bg-[#111111] border-[#111111] text-white'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                  }`}
                >
                  <p className={`font-mono font-bold text-[11px] ${item.done ? 'text-rose-400' : ''}`}>
                    {item.step}
                  </p>
                  <p className="font-semibold mt-0.5">{item.title}</p>
                </div>
              ))}
            </div>

            {/* Detail Metadata */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-y border-neutral-200 py-5">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-500">
                  Nama Sekolah / Instansi
                </dt>
                <dd className="mt-1 font-semibold text-[#111111]">
                  {foundBooking.institutionName}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-500">
                  Jenjang & Estimasi Peserta
                </dt>
                <dd className="mt-1 font-semibold text-[#111111] tabular-nums">
                  {foundBooking.educationLevel} · {foundBooking.plannedParticipants} orang
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-500">
                  Tanggal & Sesi Kunjungan
                </dt>
                <dd className="mt-1 font-semibold text-[#111111] tabular-nums">
                  {formatHariTanggalID(foundBooking.visitDate)} · {foundSession?.sessionName} (
                  {foundSession?.timeLabel})
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-500">
                  Fokus Kegiatan
                </dt>
                <dd className="mt-1 font-semibold text-[#111111]">
                  {foundBooking.activityFocus}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-500">
                  Penanggung Jawab (PIC)
                </dt>
                <dd className="mt-1 font-semibold text-[#111111]">
                  {foundBooking.picName}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-500">
                  Pustakawan Pemandu
                </dt>
                <dd className="mt-1 font-semibold text-[#111111]">
                  {foundBooking.assignedGuide ?? 'Ditugaskan setelah persetujuan'}
                </dd>
              </div>
            </dl>

            {foundBooking.adminNote && (
              <div className="p-3.5 rounded-none bg-neutral-50 border border-neutral-300 text-xs text-neutral-700">
                <span className="font-semibold text-[#111111]">Catatan Layanan: </span>
                {foundBooking.adminNote}
              </div>
            )}

            {/* Letter Upload / Self-Service Cancel Section */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono uppercase tracking-[0.08em] font-bold text-[#111111]">
                  Dokumen Surat Permohonan
                </span>
                {foundBooking.letterFileName ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{foundBooking.letterFileName}</span>
                  </span>
                ) : (
                  <span className="text-amber-800 font-medium tabular-nums">
                    Belum diunggah · Batas H-3: {formatTanggalID(foundBooking.holdExpiresAt.slice(0, 10))}
                  </span>
                )}
              </div>

              {uploadFeedback && (
                <div
                  className={`p-3 rounded-none border text-xs flex items-start gap-2 ${
                    uploadFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-700 text-emerald-900'
                      : 'bg-rose-50 border-[#E11D48] text-rose-950'
                  }`}
                >
                  {uploadFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#E11D48]" />
                  )}
                  <span>{uploadFeedback.message}</span>
                </div>
              )}

              {canSelfManage && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] rounded-none cursor-pointer">
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {foundBooking.letterFileName
                        ? 'Perbarui Berkas Surat'
                        : 'Unggah Surat Permohonan'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleUploadLetter}
                      className="sr-only"
                    />
                  </label>

                  {!confirmCancel ? (
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(true)}
                      className="px-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] font-bold text-[#E11D48] bg-white border border-[#E11D48] hover:bg-rose-50 rounded-none cursor-pointer"
                    >
                      Batalkan Reservasi
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#E11D48] font-semibold">Yakin batalkan?</span>
                      <button
                        type="button"
                        onClick={() => {
                          updateBookingStatus(
                            foundBooking.id,
                            BookingStatus.CANCELLED,
                            'Dibatalkan mandiri oleh pemohon.'
                          );
                          setConfirmCancel(false);
                        }}
                        className="px-3 py-1.5 font-mono text-[11px] uppercase font-bold text-white bg-[#E11D48] hover:bg-rose-700 rounded-none cursor-pointer"
                      >
                        Ya, Batalkan
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(false)}
                        className="px-3 py-1.5 font-mono text-[11px] uppercase font-bold text-[#111111] bg-neutral-100 border border-neutral-300 rounded-none cursor-pointer"
                      >
                        Tidak
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Digital e-Ticket QR Card */}
          <div className="xl:col-span-5 bg-white border border-[#111111] overflow-hidden">
            <div className="bg-[#111111] text-white px-6 py-5 border-b-4 border-[#E11D48]">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400">
                {INSTITUTION_INFO.agencyName}
              </p>
              <h3 className="text-base font-display font-extrabold mt-1">
                e-Ticket Kunjungan Wisata Baca
              </h3>
            </div>

            <div className="p-6 space-y-5 text-center">
              <div className="inline-flex flex-col items-center justify-center p-4 bg-white border border-[#111111]">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code untuk reservasi ${foundBooking.bookingCode}`}
                    className={`w-48 h-48 object-contain ${
                      !isTicketActive ? 'opacity-65' : ''
                    }`}
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-neutral-400">
                    Memuat QR Code...
                  </div>
                )}
                <p className="mt-2 font-mono text-sm font-bold text-[#111111] tabular-nums">
                  {foundBooking.bookingCode}
                </p>
              </div>

              <div className="text-xs space-y-1">
                <p className="font-bold text-[#111111] text-sm">
                  {foundBooking.institutionName}
                </p>
                <p className="font-mono text-neutral-600 tabular-nums">
                  {formatHariTanggalID(foundBooking.visitDate)} · {foundSession?.timeLabel}
                </p>
                <p
                  className={`font-mono text-[11px] uppercase tracking-[0.06em] font-bold pt-1.5 ${
                    isTicketActive ? 'text-emerald-700' : 'text-amber-800'
                  }`}
                >
                  {isTicketActive
                    ? 'Tiket Terverifikasi — Siap Dipindai di Lobi'
                    : `Status: ${BOOKING_STATUS_LABELS[foundBooking.status]}`}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={handleDownloadTicketPng}
                  disabled={!qrDataUrl}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] rounded-none cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Unduh e-Ticket (PNG)</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] font-bold text-[#111111] bg-white border border-[#111111] hover:bg-neutral-100 rounded-none cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Cetak</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
