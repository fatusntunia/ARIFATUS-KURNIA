import {
  ACTIVE_LOCKING_STATUSES,
  INSTITUTION_INFO,
} from '../config/sirkusConfig';
import {
  ActionResult,
  BookingStatus,
  CreateBookingPayload,
  HolidayBlock,
  SessionCode,
  SlotResolution,
  SlotStatus,
  VisitBooking,
  VisitSession,
} from '../types/sirkus';

const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function parseISODateLocal(dateISO: string): Date {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toISODateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTanggalID(dateISO: string): string {
  const date = parseISODateLocal(dateISO);
  return `${date.getDate()} ${BULAN_ID[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatHariTanggalID(dateISO: string): string {
  const date = parseISODateLocal(dateISO);
  return `${HARI_ID[date.getDay()]}, ${formatTanggalID(dateISO)}`;
}

export function formatBulanTahunID(year: number, monthIndex: number): string {
  return `${BULAN_ID[monthIndex]} ${year}`;
}

export function isWeekendISO(dateISO: string): boolean {
  const day = parseISODateLocal(dateISO).getDay();
  return day === 0 || day === 6;
}

export function calculateHoldExpiryISO(visitDateISO: string): string {
  const date = parseISODateLocal(visitDateISO);
  date.setDate(date.getDate() - INSTITUTION_INFO.autoReleaseDeadlineDays);
  return `${toISODateLocal(date)}T16:00:00+07:00`;
}

/**
 * Menghasilkan kode booking unik berformat:
 * SB-YYMMDD-S1-XXXX (contoh: SB-261118-S1-4092)
 */
export function generateUniqueBookingCode(
  visitDateISO: string,
  sessionCode: SessionCode,
  existingBookings: VisitBooking[]
): string {
  const compactDate = visitDateISO.replaceAll('-', '').slice(2); // YYMMDD
  const sessionTag = sessionCode === SessionCode.SESI_1 ? 'S1' : 'S2';
  const existingSet = new Set(existingBookings.map((b) => b.bookingCode.toUpperCase()));

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const candidate = `SB-${compactDate}-${sessionTag}-${suffix}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  const fallback = String(Date.now()).slice(-4);
  return `SB-${compactDate}-${sessionTag}-${fallback}`;
}

/**
 * Menentukan status final sebuah slot (Hijau=Tersedia, Kuning=Keep/Pending, Merah=Booked, Abu-abu=Libur)
 * berdasarkan kombinasi unik (visit_date, session_id).
 */
export function resolveSlotStatus(
  dateISO: string,
  session: VisitSession,
  bookings: VisitBooking[],
  holidayBlocks: HolidayBlock[]
): SlotResolution {
  // 1. Cek jika sesi dinonaktifkan di master sesi
  if (!session.isActive) {
    return {
      date: dateISO,
      session,
      status: SlotStatus.HOLIDAY,
      isLocked: true,
      booking: null,
      holidayBlock: null,
      statusReason: `${session.sessionName} sedang dinonaktifkan pada pengaturan master sesi.`,
    };
  }

  // 2. Cek blokir libur eksplisit (tanggal penuh atau khusus sesi ini)
  const holiday = holidayBlocks.find(
    (h) => h.blockDate === dateISO && (h.sessionId === null || h.sessionId === session.id)
  );
  if (holiday) {
    return {
      date: dateISO,
      session,
      status: SlotStatus.HOLIDAY,
      isLocked: true,
      booking: null,
      holidayBlock: holiday,
      statusReason: holiday.reason,
    };
  }

  // 3. Cek akhir pekan (Sabtu & Minggu tutup layanan wisata baca reguler)
  if (isWeekendISO(dateISO)) {
    return {
      date: dateISO,
      session,
      status: SlotStatus.HOLIDAY,
      isLocked: true,
      booking: null,
      holidayBlock: null,
      statusReason: 'Layanan kunjungan reguler tutup pada hari Sabtu & Minggu.',
    };
  }

  // 4. Cek transaksi booking aktif pada kombinasi unik (visit_date, session_id)
  const activeBooking = bookings.find(
    (b) =>
      b.visitDate === dateISO &&
      b.sessionId === session.id &&
      ACTIVE_LOCKING_STATUSES.includes(b.status)
  );

  if (activeBooking) {
    if (
      activeBooking.status === BookingStatus.BOOKED ||
      activeBooking.status === BookingStatus.COMPLETED
    ) {
      return {
        date: dateISO,
        session,
        status: SlotStatus.BOOKED,
        isLocked: true,
        booking: activeBooking,
        holidayBlock: null,
        statusReason: `Terkunci oleh ${activeBooking.institutionName} (${activeBooking.bookingCode}).`,
      };
    }

    return {
      date: dateISO,
      session,
      status: SlotStatus.KEEP,
      isLocked: true,
      booking: activeBooking,
      holidayBlock: null,
      statusReason: `Sedang Keep/Pending oleh ${activeBooking.institutionName} (${activeBooking.bookingCode}).`,
    };
  }

  // 5. Slot kosong dan siap dipesan
  return {
    date: dateISO,
    session,
    status: SlotStatus.AVAILABLE,
    isLocked: false,
    booking: null,
    holidayBlock: null,
    statusReason: `Slot tersedia untuk maksimal ${session.maxCapacity} peserta.`,
  };
}

/**
 * Validasi Anti-Bentrok & Penguncian Sesi (Conflict Detection)
 */
export function validateBookingCreation(
  payload: CreateBookingPayload,
  sessions: VisitSession[],
  bookings: VisitBooking[],
  holidayBlocks: HolidayBlock[]
): ActionResult<SlotResolution> {
  const session = sessions.find((s) => s.id === payload.sessionId);
  if (!session) {
    return {
      ok: false,
      message: 'Sesi kunjungan tidak ditemukan pada Master Sesi.',
    };
  }

  if (!payload.institutionName.trim() || !payload.picName.trim() || !payload.picPhone.trim()) {
    return {
      ok: false,
      message: 'Nama instansi, nama PIC, dan nomor WhatsApp/telepon PIC wajib diisi.',
    };
  }

  if (payload.plannedParticipants < 1 || payload.plannedParticipants > session.maxCapacity) {
    return {
      ok: false,
      message: `Jumlah peserta harus antara 1 hingga ${session.maxCapacity} orang sesuai kuota ${session.sessionName}.`,
    };
  }

  const slot = resolveSlotStatus(payload.visitDate, session, bookings, holidayBlocks);

  if (slot.status === SlotStatus.HOLIDAY) {
    return {
      ok: false,
      message: `Konflik Jadwal: Tanggal ${formatTanggalID(payload.visitDate)} (${session.sessionName}) berstatus Libur/Tutup (${slot.statusReason}).`,
    };
  }

  if (slot.isLocked && slot.booking) {
    return {
      ok: false,
      message: `Bentrok Terdeteksi (Anti-Double Booking): ${session.sessionName} pada ${formatTanggalID(
        payload.visitDate
      )} sudah dikunci oleh ${slot.booking.institutionName} dengan kode ${slot.booking.bookingCode}.`,
      conflictBooking: slot.booking,
    };
  }

  return {
    ok: true,
    message: 'Slot tersedia dan lolos validasi anti-bentrok.',
    data: slot,
  };
}

export interface CalendarGridCell {
  dateISO: string;
  dayNumber: number;
  isCurrentMonth: boolean;
}

/**
 * Membuat grid kalender 7 kolom (Senin - Minggu) untuk bulan tertentu.
 */
export function buildCalendarMonthGrid(year: number, monthIndex: number): CalendarGridCell[] {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);

  // Konversi hari JS (0=Min..6=Sab) ke Senin-awal (0=Sen..6=Min)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const cells: CalendarGridCell[] = [];

  for (let i = startOffset - 1; i >= 0; i -= 1) {
    const d = new Date(year, monthIndex, -i);
    cells.push({
      dateISO: toISODateLocal(d),
      dayNumber: d.getDate(),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const d = new Date(year, monthIndex, day);
    cells.push({
      dateISO: toISODateLocal(d),
      dayNumber: day,
      isCurrentMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    const nextOffset = cells.length - (startOffset + totalDays) + 1;
    const d = new Date(year, monthIndex + 1, nextOffset);
    cells.push({
      dateISO: toISODateLocal(d),
      dayNumber: d.getDate(),
      isCurrentMonth: false,
    });
  }

  return cells;
}
