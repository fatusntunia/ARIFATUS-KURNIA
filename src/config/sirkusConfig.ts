import {
  ActivityFocus,
  BookingStatus,
  EducationLevel,
  SessionCode,
  SlotStatus,
} from '../types/sirkus';

export const INSTITUTION_INFO = {
  appName: 'SIRKUS BACA',
  fullTitle: 'Sistem Informasi Reservasi Kunjungan Wisata Baca',
  agencyName: 'Dinas Perpustakaan dan Kearsipan',
  tagline: 'Rencanakan Kunjungan Literasi dengan Mudah, Pasti Jadwalnya, Nyaman Layanannya.',
  operationalHours: '08.00 – 12.00 WIB',
  operationalDays: 'Senin – Jumat (Hari Kerja)',
  autoReleaseDeadlineDays: 3, // Batas unggah surat maksimal H-3 sebelum kunjungan
  defaultMaxCapacity: 60,
  brandPrimaryHex: '#111111',
} as const;

export const SESSION_SCHEDULE_RULES = [
  {
    id: 'sesi-1',
    code: SessionCode.SESI_1,
    name: 'Kelompok Kunjung 1',
    startTime: '08:00',
    endTime: '12:00',
    timeLabel: '08.00 – 12.00 WIB',
    durationMinutes: 240,
  },
  {
    id: 'sesi-2',
    code: SessionCode.SESI_2,
    name: 'Kelompok Kunjung 2',
    startTime: '08:00',
    endTime: '12:00',
    timeLabel: '08.00 – 12.00 WIB',
    durationMinutes: 240,
  },
] as const;

export interface SlotVisualMeta {
  status: SlotStatus;
  label: string;
  shortLabel: string;
  colorName: string;
  description: string;
  dotClass: string;
  badgeClass: string;
  cellClass: string;
  borderClass: string;
  textClass: string;
}

export const SLOT_STATUS_CONFIG: Record<SlotStatus, SlotVisualMeta> = {
  [SlotStatus.AVAILABLE]: {
    status: SlotStatus.AVAILABLE,
    label: 'Tersedia',
    shortLabel: 'Tersedia',
    colorName: 'Hijau',
    description: 'Slot kelompok kunjung terbuka dan dapat dipesan oleh satu rombongan.',
    dotClass: 'bg-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    cellClass: 'bg-emerald-50/75 hover:bg-emerald-100/80 border-emerald-300 text-emerald-950',
    borderClass: 'border-emerald-300',
    textClass: 'text-emerald-700',
  },
  [SlotStatus.KEEP]: {
    status: SlotStatus.KEEP,
    label: 'Keep / Pending',
    shortLabel: 'Keep',
    colorName: 'Kuning',
    description: 'Slot dikunci sementara menunggu kelengkapan & verifikasi surat (maks. H-3).',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
    cellClass: 'bg-amber-50/85 hover:bg-amber-100/80 border-amber-300 text-amber-950',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-800',
  },
  [SlotStatus.BOOKED]: {
    status: SlotStatus.BOOKED,
    label: 'Booked',
    shortLabel: 'Booked',
    colorName: 'Merah',
    description: 'Slot terkunci permanen oleh rombongan yang telah disetujui.',
    dotClass: 'bg-[#E11D48]',
    badgeClass: 'bg-rose-50 text-[#BE123C] border-rose-300',
    cellClass: 'bg-rose-50/85 hover:bg-rose-100/80 border-rose-300 text-rose-950',
    borderClass: 'border-rose-300',
    textClass: 'text-[#E11D48]',
  },
  [SlotStatus.HOLIDAY]: {
    status: SlotStatus.HOLIDAY,
    label: 'Libur / Tutup',
    shortLabel: 'Libur',
    colorName: 'Abu-abu',
    description: 'Hari libur, akhir pekan, atau layanan ditutup sementara oleh pengelola.',
    dotClass: 'bg-neutral-400',
    badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    cellClass: 'bg-neutral-100 border-neutral-300 text-neutral-600',
    borderClass: 'border-neutral-300',
    textClass: 'text-neutral-600',
  },
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.KEEP]: 'Keep / Menunggu Verifikasi',
  [BookingStatus.BOOKED]: 'Disetujui / Booked',
  [BookingStatus.REVISION]: 'Perlu Revisi Berkas',
  [BookingStatus.REJECTED]: 'Ditolak Admin',
  [BookingStatus.CANCELLED]: 'Dibatalkan',
  [BookingStatus.AUTO_RELEASED]: 'Dilepas Otomatis (H-3)',
  [BookingStatus.COMPLETED]: 'Kunjungan Selesai',
};

export const ACTIVE_LOCKING_STATUSES: BookingStatus[] = [
  BookingStatus.KEEP,
  BookingStatus.REVISION,
  BookingStatus.BOOKED,
  BookingStatus.COMPLETED,
];

export const EDUCATION_LEVEL_OPTIONS: EducationLevel[] = [
  EducationLevel.PAUD_TK,
  EducationLevel.SD,
  EducationLevel.SMP,
  EducationLevel.SMA,
  EducationLevel.PT,
  EducationLevel.UMUM,
];

export const ACTIVITY_FOCUS_OPTIONS: ActivityFocus[] = [
  ActivityFocus.DONGENG,
  ActivityFocus.LITERASI_DIGITAL,
  ActivityFocus.TUR_ARSIP,
  ActivityFocus.PAKET_LENGKAP,
];
