export enum SessionCode {
  SESI_1 = 'SESI-1',
  SESI_2 = 'SESI-2',
}

export enum SlotStatus {
  AVAILABLE = 'available', // Hijau: Tersedia
  KEEP = 'keep',           // Kuning: Keep / Pending Verifikasi
  BOOKED = 'booked',       // Merah: Terkunci / Booked
  HOLIDAY = 'holiday',     // Abu-abu: Libur / Tutup Layanan
}

export enum BookingStatus {
  KEEP = 'keep',                     // Kuning: Soft-booking / menunggu surat & verifikasi
  BOOKED = 'booked',                 // Merah: Disetujui & terkunci permanen
  REVISION = 'revision',             // Kuning: Admin meminta revisi surat
  REJECTED = 'rejected',             // Dilepas: Ditolak admin (slot kembali tersedia)
  CANCELLED = 'cancelled',           // Dilepas: Dibatalkan pemohon/admin
  AUTO_RELEASED = 'auto_released',   // Dilepas: Melewati batas H-3 tanpa surat
  COMPLETED = 'completed',           // Selesai: Sudah check-out kunjungan
}

export enum EducationLevel {
  PAUD_TK = 'PAUD/TK',
  SD = 'SD/MI',
  SMP = 'SMP/MTs',
  SMA = 'SMA/SMK/MA',
  PT = 'Perguruan Tinggi',
  UMUM = 'Masyarakat Umum / Komunitas',
}

export enum ActivityFocus {
  DONGENG = 'Wisata Baca & Dongeng Interaktif',
  LITERASI_DIGITAL = 'Literasi Digital & Pustaka Elektronik',
  TUR_ARSIP = 'Pengenalan Galeri Arsip Daerah',
  PAKET_LENGKAP = 'Tur Edukasi Terpadu (Semua Zona)',
}

export type BookingSource = 'online' | 'manual_telepon' | 'manual_walkin';

export interface VisitSession {
  id: string;
  sessionCode: SessionCode;
  sessionName: string;
  startTime: string; // e.g., "08:00"
  endTime: string;   // e.g., "12:00"
  timeLabel: string; // e.g., "08.00 – 12.00 WIB"
  maxCapacity: number;
  idealZoneCapacity: number;
  isActive: boolean;
  description: string;
}

export interface ServiceZone {
  id: string;
  code: string;
  name: string;
  location: string;
  capacity: number;
  facilities: string[];
  status: 'siap' | 'perbaikan' | 'terbatas';
}

export interface HolidayBlock {
  id: string;
  blockDate: string;      // YYYY-MM-DD
  sessionId: string | null; // null = tutup seharian (Sesi 1 & Sesi 2)
  reason: string;
  category: 'libur_nasional' | 'cuti_bersama' | 'pemeliharaan_internal' | 'akhir_pekan';
  createdBy: string;
  createdAt: string;
}

export interface VisitBooking {
  id: string;
  bookingCode: string; // Kode booking unik, misal: SB-261117-S1-001
  institutionName: string;
  educationLevel: EducationLevel;
  institutionAddress: string;
  picName: string;
  picPhone: string;
  picEmail: string;
  visitDate: string; // YYYY-MM-DD
  sessionId: string; // Reference ke VisitSession.id
  plannedParticipants: number;
  actualParticipants?: number;
  activityFocus: ActivityFocus;
  letterFileName?: string;
  letterFileSize?: number;
  letterMimeType?: string;
  letterUploadedAt?: string;
  status: BookingStatus;
  source: BookingSource;
  holdExpiresAt: string; // ISO datetime batas H-3 sebelum auto-release
  adminNote?: string;
  assignedGuide?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: 'visit_bookings' | 'visit_sessions' | 'holiday_blocks';
  entityId: string;
  detail: string;
}

export interface SlotResolution {
  date: string;
  session: VisitSession;
  status: SlotStatus;
  isLocked: boolean;
  booking: VisitBooking | null;
  holidayBlock: HolidayBlock | null;
  statusReason: string;
}

export interface FacilityIssue {
  id: string;
  zoneId: string;
  issueTitle: string;
  priority: 'rendah' | 'sedang' | 'tinggi';
  status: 'terbuka' | 'dalam_perbaikan' | 'selesai';
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
}

export interface CreateBookingPayload {
  institutionName: string;
  educationLevel: EducationLevel;
  institutionAddress: string;
  picName: string;
  picPhone: string;
  picEmail: string;
  visitDate: string;
  sessionId: string;
  plannedParticipants: number;
  activityFocus: ActivityFocus;
  letterFileName?: string;
  letterFileSize?: number;
  letterMimeType?: string;
  source?: BookingSource;
  initialStatus?: BookingStatus.KEEP | BookingStatus.BOOKED;
  assignedGuide?: string;
  adminNote?: string;
}

export interface ActionResult<T = VisitBooking> {
  ok: boolean;
  message: string;
  data?: T;
  conflictBooking?: VisitBooking;
}

export type WorkspaceTab = 'kalender' | 'master_sesi' | 'daftar_booking' | 'model_data';
export type PublicTab = 'kalender_publik' | 'ajukan_kunjungan' | 'cek_status' | 'tata_tertib';
export type PortalMode = 'publik' | 'admin';

export type AdminMenuKey =
  | 'dashboard'
  | 'kalender_jadwal'
  | 'daftar_reservasi'
  | 'verifikasi_surat'
  | 'kesiapan_ruang'
  | 'analytics'
  | 'laporan'
  | 'pengaturan';
