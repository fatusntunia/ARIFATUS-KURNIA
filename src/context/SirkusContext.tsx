import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  DEFAULT_CALENDAR_FOCUS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BOOKINGS,
  INITIAL_FACILITY_ISSUES,
  INITIAL_HOLIDAY_BLOCKS,
  INITIAL_SERVICE_ZONES,
  INITIAL_SESSIONS,
} from '../data/initialSeed';
import {
  ActionResult,
  AuditLogEntry,
  BookingStatus,
  CreateBookingPayload,
  FacilityIssue,
  HolidayBlock,
  ServiceZone,
  SlotResolution,
  SlotStatus,
  VisitBooking,
  VisitSession,
} from '../types/sirkus';
import {
  calculateHoldExpiryISO,
  formatTanggalID,
  generateUniqueBookingCode,
  resolveSlotStatus,
  validateBookingCreation,
} from '../utils/bookingUtils';

const STORAGE_KEY = 'sirkus_baca_state_v1';

export interface SirkusState {
  sessions: VisitSession[];
  bookings: VisitBooking[];
  holidayBlocks: HolidayBlock[];
  serviceZones: ServiceZone[];
  facilityIssues: FacilityIssue[];
  auditLogs: AuditLogEntry[];
}

type SirkusAction =
  | { type: 'ADD_BOOKING'; payload: { booking: VisitBooking; log: AuditLogEntry } }
  | {
      type: 'UPDATE_BOOKING_STATUS';
      payload: {
        bookingId: string;
        status: BookingStatus;
        adminNote?: string;
        assignedGuide?: string;
        log: AuditLogEntry;
      };
    }
  | {
      type: 'RESCHEDULE_BOOKING';
      payload: {
        bookingId: string;
        visitDate: string;
        sessionId: string;
        holdExpiresAt: string;
        adminNote?: string;
        log: AuditLogEntry;
      };
    }
  | {
      type: 'ATTACH_LETTER';
      payload: {
        bookingId: string;
        fileName: string;
        fileSize?: number;
        mimeType?: string;
        log: AuditLogEntry;
      };
    }
  | { type: 'ADD_HOLIDAY_BLOCK'; payload: { block: HolidayBlock; log: AuditLogEntry } }
  | { type: 'REMOVE_HOLIDAY_BLOCK'; payload: { blockId: string; log: AuditLogEntry } }
  | {
      type: 'UPDATE_SESSION_CONFIG';
      payload: {
        sessionId: string;
        maxCapacity: number;
        idealZoneCapacity: number;
        isActive: boolean;
        log: AuditLogEntry;
      };
    }
  | {
      type: 'UPDATE_ZONE_STATUS';
      payload: { zoneId: string; status: ServiceZone['status']; log: AuditLogEntry };
    }
  | { type: 'ADD_FACILITY_ISSUE'; payload: { issue: FacilityIssue; log: AuditLogEntry } }
  | { type: 'RESOLVE_FACILITY_ISSUE'; payload: { issueId: string; log: AuditLogEntry } }
  | { type: 'RESET_STATE' };

function buildInitialState(): SirkusState {
  return {
    sessions: INITIAL_SESSIONS,
    bookings: INITIAL_BOOKINGS,
    holidayBlocks: INITIAL_HOLIDAY_BLOCKS,
    serviceZones: INITIAL_SERVICE_ZONES,
    facilityIssues: INITIAL_FACILITY_ISSUES,
    auditLogs: INITIAL_AUDIT_LOGS,
  };
}

function loadPersistedState(): SirkusState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return buildInitialState();
    }
    const parsed = JSON.parse(raw) as Partial<SirkusState>;
    if (
      Array.isArray(parsed.sessions) &&
      parsed.sessions.length === 2 &&
      Array.isArray(parsed.bookings) &&
      Array.isArray(parsed.holidayBlocks) &&
      Array.isArray(parsed.serviceZones) &&
      Array.isArray(parsed.auditLogs)
    ) {
      const hasLegacyZoneNames = parsed.serviceZones.some(
        (z) =>
          z.name === 'Ruang Baca Anak & Edukasi Dini' ||
          z.name === 'Ruang Audiovisual & Dongeng' ||
          z.name === 'Pojok Literasi Digital & e-Pustaka'
      );
      const syncedZones = hasLegacyZoneNames
        ? INITIAL_SERVICE_ZONES.map((freshZone) => {
            const existing = parsed.serviceZones?.find((old) => old.id === freshZone.id);
            return existing ? { ...freshZone, status: existing.status } : freshZone;
          })
        : parsed.serviceZones;

      const hasLegacyHourlySessions = parsed.sessions.some(
        (s) =>
          s.sessionName.includes('(Pagi') ||
          s.sessionName.includes('Menjelang Siang') ||
          s.endTime === '10:00' ||
          s.startTime === '10:00'
      );
      const syncedSessions = hasLegacyHourlySessions
        ? INITIAL_SESSIONS.map((freshSession) => {
            const existing = parsed.sessions?.find((old) => old.id === freshSession.id);
            return existing
              ? {
                  ...freshSession,
                  maxCapacity: existing.maxCapacity,
                  idealZoneCapacity: existing.idealZoneCapacity,
                  isActive: existing.isActive,
                }
              : freshSession;
          })
        : parsed.sessions;

      return {
        sessions: syncedSessions,
        bookings: parsed.bookings,
        holidayBlocks: parsed.holidayBlocks,
        serviceZones: syncedZones,
        facilityIssues: Array.isArray(parsed.facilityIssues)
          ? parsed.facilityIssues
          : INITIAL_FACILITY_ISSUES,
        auditLogs: parsed.auditLogs,
      };
    }
  } catch {
    // Fallback ke seed awal jika storage korup atau tidak tersedia
  }
  return buildInitialState();
}

function sirkusReducer(state: SirkusState, action: SirkusAction): SirkusState {
  switch (action.type) {
    case 'ADD_BOOKING':
      return {
        ...state,
        bookings: [action.payload.booking, ...state.bookings],
        auditLogs: [action.payload.log, ...state.auditLogs],
      };

    case 'UPDATE_BOOKING_STATUS':
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.payload.bookingId
            ? {
                ...b,
                status: action.payload.status,
                adminNote: action.payload.adminNote ?? b.adminNote,
                assignedGuide: action.payload.assignedGuide ?? b.assignedGuide,
                updatedAt: new Date().toISOString(),
              }
            : b
        ),
        auditLogs: [action.payload.log, ...state.auditLogs],
      };

    case 'RESCHEDULE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.payload.bookingId
            ? {
                ...b,
                visitDate: action.payload.visitDate,
                sessionId: action.payload.sessionId,
                holdExpiresAt: action.payload.holdExpiresAt,
                adminNote: action.payload.adminNote ?? b.adminNote,
                updatedAt: new Date().toISOString(),
              }
            : b
        ),
        auditLogs: [action.payload.log, ...state.auditLogs],
      };

    case 'ATTACH_LETTER':
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.payload.bookingId
            ? {
                ...b,
                letterFileName: action.payload.fileName,
                letterFileSize: action.payload.fileSize,
                letterMimeType: action.payload.mimeType,
                letterUploadedAt: new Date().toISOString(),
                status: b.status === BookingStatus.REVISION ? BookingStatus.KEEP : b.status,
                updatedAt: new Date().toISOString(),
              }
            : b
        ),
        auditLogs: [action.payload.log, ...state.auditLogs],
      };

    case 'ADD_HOLIDAY_BLOCK':
      return {
        ...state,
        holidayBlocks: [...state.holidayBlocks, action.payload.block],
        auditLogs: [action.payload.log, ...state.auditLogs],
      };

    case 'REMOVE_HOLIDAY_BLOCK':
      return {
        ...state,
        holidayBlocks: state.holidayBlocks.filter((h) => h.id !== action.payload.blockId),
        auditLogs: [action.payload.log, ...state.auditLogs],
      };

    case 'UPDATE_SESSION_CONFIG':
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.payload.sessionId
            ? {
                ...s,
                maxCapacity: action.payload.maxCapacity,
                idealZoneCapacity: action.payload.idealZoneCapacity,
                isActive: action.payload.isActive,
              }
            : s
        ),
        auditLogs: [action.payload.log, ...state.auditLogs],
      };

    case 'UPDATE_ZONE_STATUS':
      return {
        ...state,
        serviceZones: state.serviceZones.map((z) =>
          z.id === action.payload.zoneId ? { ...z, status: action.payload.status } : z
        ),
        auditLogs: [action.payload.log, ...state.auditLogs],
      };

    case 'ADD_FACILITY_ISSUE':
      return {
        ...state,
        facilityIssues: [action.payload.issue, ...state.facilityIssues],
        auditLogs: [action.payload.log, ...state.auditLogs],
      };

    case 'RESOLVE_FACILITY_ISSUE':
      return {
        ...state,
        facilityIssues: state.facilityIssues.map((iss) =>
          iss.id === action.payload.issueId
            ? { ...iss, status: 'selesai', resolvedAt: new Date().toISOString() }
            : iss
        ),
        auditLogs: [action.payload.log, ...state.auditLogs],
      };

    case 'RESET_STATE':
      return buildInitialState();

    default:
      return state;
  }
}

export interface MonthlySlotSummary {
  totalWorkingSlots: number;
  availableCount: number;
  keepCount: number;
  bookedCount: number;
  holidayCount: number;
  occupancyPercent: number;
  totalPlannedParticipants: number;
}

interface SirkusContextValue {
  state: SirkusState;
  getSlot: (dateISO: string, sessionId: string) => SlotResolution | null;
  getDaySlots: (dateISO: string) => SlotResolution[];
  getMonthlySummary: (year: number, monthIndex: number) => MonthlySlotSummary;
  findBookingByCode: (code: string) => VisitBooking | undefined;
  createBooking: (payload: CreateBookingPayload) => ActionResult<VisitBooking>;
  updateBookingStatus: (
    bookingId: string,
    status: BookingStatus,
    adminNote?: string,
    assignedGuide?: string
  ) => ActionResult<VisitBooking>;
  rescheduleBooking: (
    bookingId: string,
    newVisitDate: string,
    newSessionId: string,
    adminNote?: string
  ) => ActionResult<VisitBooking>;
  attachBookingLetter: (
    bookingId: string,
    fileName: string,
    fileSize?: number,
    mimeType?: string
  ) => ActionResult<VisitBooking>;
  addHolidayBlock: (
    blockDate: string,
    sessionId: string | null,
    reason: string,
    category: HolidayBlock['category']
  ) => ActionResult<HolidayBlock>;
  removeHolidayBlock: (blockId: string) => void;
  updateSessionConfig: (
    sessionId: string,
    maxCapacity: number,
    idealZoneCapacity: number,
    isActive: boolean
  ) => ActionResult<VisitSession>;
  updateZoneStatus: (zoneId: string, status: ServiceZone['status']) => void;
  addFacilityIssue: (
    zoneId: string,
    issueTitle: string,
    priority: FacilityIssue['priority']
  ) => ActionResult<FacilityIssue>;
  resolveFacilityIssue: (issueId: string) => void;
  resetAllData: () => void;
}

const SirkusContext = createContext<SirkusContextValue | undefined>(undefined);

export const SirkusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(sirkusReducer, undefined, loadPersistedState);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Abaikan error quota localStorage
    }
  }, [state]);

  const getSlot = useCallback(
    (dateISO: string, sessionId: string): SlotResolution | null => {
      const session = state.sessions.find((s) => s.id === sessionId);
      if (!session) return null;
      return resolveSlotStatus(dateISO, session, state.bookings, state.holidayBlocks);
    },
    [state.sessions, state.bookings, state.holidayBlocks]
  );

  const getDaySlots = useCallback(
    (dateISO: string): SlotResolution[] => {
      return state.sessions.map((session) =>
        resolveSlotStatus(dateISO, session, state.bookings, state.holidayBlocks)
      );
    },
    [state.sessions, state.bookings, state.holidayBlocks]
  );

  const getMonthlySummary = useCallback(
    (year: number, monthIndex: number): MonthlySlotSummary => {
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      let availableCount = 0;
      let keepCount = 0;
      let bookedCount = 0;
      let holidayCount = 0;
      let totalPlannedParticipants = 0;

      for (let day = 1; day <= daysInMonth; day += 1) {
        const d = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const slots = getDaySlots(d);
        for (const slot of slots) {
          if (slot.status === SlotStatus.AVAILABLE) availableCount += 1;
          else if (slot.status === SlotStatus.KEEP) {
            keepCount += 1;
            if (slot.booking) totalPlannedParticipants += slot.booking.plannedParticipants;
          } else if (slot.status === SlotStatus.BOOKED) {
            bookedCount += 1;
            if (slot.booking) totalPlannedParticipants += slot.booking.plannedParticipants;
          } else {
            holidayCount += 1;
          }
        }
      }

      const totalWorkingSlots = availableCount + keepCount + bookedCount;
      const occupied = keepCount + bookedCount;
      const occupancyPercent =
        totalWorkingSlots > 0 ? Math.round((occupied / totalWorkingSlots) * 100) : 0;

      return {
        totalWorkingSlots,
        availableCount,
        keepCount,
        bookedCount,
        holidayCount,
        occupancyPercent,
        totalPlannedParticipants,
      };
    },
    [getDaySlots]
  );

  const findBookingByCode = useCallback(
    (code: string) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) return undefined;
      return state.bookings.find((b) => b.bookingCode.toUpperCase() === normalized);
    },
    [state.bookings]
  );

  const createBooking = useCallback(
    (payload: CreateBookingPayload): ActionResult<VisitBooking> => {
      const validation = validateBookingCreation(
        payload,
        state.sessions,
        state.bookings,
        state.holidayBlocks
      );

      if (!validation.ok || !validation.data) {
        return {
          ok: false,
          message: validation.message,
          conflictBooking: validation.conflictBooking,
        };
      }

      const session = validation.data.session;
      const bookingCode = generateUniqueBookingCode(
        payload.visitDate,
        session.sessionCode,
        state.bookings
      );
      const nowISO = new Date().toISOString();
      const targetStatus = payload.initialStatus ?? BookingStatus.KEEP;

      const newBooking: VisitBooking = {
        id: `bk-${Date.now()}`,
        bookingCode,
        institutionName: payload.institutionName.trim(),
        educationLevel: payload.educationLevel,
        institutionAddress: payload.institutionAddress.trim() || '-',
        picName: payload.picName.trim(),
        picPhone: payload.picPhone.trim(),
        picEmail: payload.picEmail.trim() || '-',
        visitDate: payload.visitDate,
        sessionId: payload.sessionId,
        plannedParticipants: payload.plannedParticipants,
        activityFocus: payload.activityFocus,
        letterFileName: payload.letterFileName?.trim() || undefined,
        letterFileSize: payload.letterFileSize,
        letterMimeType: payload.letterMimeType,
        letterUploadedAt: payload.letterFileName ? nowISO : undefined,
        status: targetStatus,
        source: payload.source ?? 'online',
        holdExpiresAt: calculateHoldExpiryISO(payload.visitDate),
        assignedGuide: payload.assignedGuide?.trim() || undefined,
        adminNote:
          payload.adminNote?.trim() ||
          (targetStatus === BookingStatus.BOOKED
            ? 'Slot langsung dikunci (Booked) oleh pengelola.'
            : 'Slot dikunci sementara (Keep/Pending). Unggah surat paling lambat H-3.'),
        createdAt: nowISO,
        updatedAt: nowISO,
      };

      const log: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: nowISO,
        actor: payload.source && payload.source !== 'online' ? 'Admin Layanan' : newBooking.picName,
        action: targetStatus === BookingStatus.BOOKED ? 'CREATE_BOOKED' : 'CREATE_KEEP_SLOT',
        entity: 'visit_bookings',
        entityId: newBooking.id,
        detail: `Reservasi ${newBooking.bookingCode} (${newBooking.institutionName}) mengunci ${session.sessionName} pada ${newBooking.visitDate}.`,
      };

      dispatch({ type: 'ADD_BOOKING', payload: { booking: newBooking, log } });

      return {
        ok: true,
        message: `Berhasil mengunci ${session.sessionName} dengan kode booking ${newBooking.bookingCode}.`,
        data: newBooking,
      };
    },
    [state.sessions, state.bookings, state.holidayBlocks]
  );

  const updateBookingStatus = useCallback(
    (
      bookingId: string,
      status: BookingStatus,
      adminNote?: string,
      assignedGuide?: string
    ): ActionResult<VisitBooking> => {
      const target = state.bookings.find((b) => b.id === bookingId);
      if (!target) {
        return { ok: false, message: 'Data booking tidak ditemukan.' };
      }

      const nowISO = new Date().toISOString();
      const log: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: nowISO,
        actor: 'Admin Layanan',
        action: `STATUS_${status.toUpperCase()}`,
        entity: 'visit_bookings',
        entityId: target.id,
        detail: `Mengubah status ${target.bookingCode} (${target.institutionName}) menjadi ${status}.`,
      };

      dispatch({
        type: 'UPDATE_BOOKING_STATUS',
        payload: { bookingId, status, adminNote, assignedGuide, log },
      });

      return {
        ok: true,
        message: `Status ${target.bookingCode} diperbarui menjadi ${status}.`,
        data: {
          ...target,
          status,
          adminNote: adminNote ?? target.adminNote,
          assignedGuide: assignedGuide ?? target.assignedGuide,
        },
      };
    },
    [state.bookings]
  );

  const rescheduleBooking = useCallback(
    (
      bookingId: string,
      newVisitDate: string,
      newSessionId: string,
      adminNote?: string
    ): ActionResult<VisitBooking> => {
      const target = state.bookings.find((b) => b.id === bookingId);
      if (!target) {
        return { ok: false, message: 'Data reservasi tidak ditemukan.' };
      }
      const targetSession = state.sessions.find((s) => s.id === newSessionId);
      if (!targetSession) {
        return { ok: false, message: 'Sesi tujuan tidak valid.' };
      }

      if (target.visitDate === newVisitDate && target.sessionId === newSessionId) {
        return { ok: false, message: 'Tanggal dan sesi tujuan sama dengan jadwal saat ini.' };
      }

      const otherBookings = state.bookings.filter((b) => b.id !== bookingId);
      const slotCheck = resolveSlotStatus(
        newVisitDate,
        targetSession,
        otherBookings,
        state.holidayBlocks
      );

      if (slotCheck.status === SlotStatus.HOLIDAY) {
        return {
          ok: false,
          message: `Jadwal tujuan (${formatTanggalID(newVisitDate)} - ${targetSession.sessionName}) berstatus Libur/Tutup: ${slotCheck.statusReason}`,
        };
      }

      if (slotCheck.isLocked && slotCheck.booking) {
        return {
          ok: false,
          message: `Bentrok Reschedule: Slot tujuan sudah dikunci oleh ${slotCheck.booking.institutionName} (${slotCheck.booking.bookingCode}).`,
          conflictBooking: slotCheck.booking,
        };
      }

      const nowISO = new Date().toISOString();
      const holdExpiresAt = calculateHoldExpiryISO(newVisitDate);
      const finalNote =
        adminNote?.trim() ||
        `Dijadwalkan ulang oleh Admin ke ${formatTanggalID(newVisitDate)} (${targetSession.sessionName}).`;

      const log: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: nowISO,
        actor: 'Admin Layanan',
        action: 'RESCHEDULE_BOOKING',
        entity: 'visit_bookings',
        entityId: target.id,
        detail: `Reschedule ${target.bookingCode} dari ${target.visitDate} ke ${newVisitDate} (${targetSession.sessionName}).`,
      };

      dispatch({
        type: 'RESCHEDULE_BOOKING',
        payload: {
          bookingId,
          visitDate: newVisitDate,
          sessionId: newSessionId,
          holdExpiresAt,
          adminNote: finalNote,
          log,
        },
      });

      return {
        ok: true,
        message: `Reservasi ${target.bookingCode} berhasil dijadwalkan ulang ke ${formatTanggalID(
          newVisitDate
        )} (${targetSession.sessionName}).`,
        data: {
          ...target,
          visitDate: newVisitDate,
          sessionId: newSessionId,
          holdExpiresAt,
          adminNote: finalNote,
        },
      };
    },
    [state.bookings, state.sessions, state.holidayBlocks]
  );

  const attachBookingLetter = useCallback(
    (
      bookingId: string,
      fileName: string,
      fileSize?: number,
      mimeType?: string
    ): ActionResult<VisitBooking> => {
      const target = state.bookings.find((b) => b.id === bookingId);
      if (!target) {
        return { ok: false, message: 'Data reservasi tidak ditemukan.' };
      }
      if (!fileName.trim()) {
        return { ok: false, message: 'Pilih berkas surat permohonan terlebih dahulu.' };
      }

      const nowISO = new Date().toISOString();
      const log: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: nowISO,
        actor: `Pemohon (${target.picName})`,
        action: 'UPLOAD_LETTER',
        entity: 'visit_bookings',
        entityId: target.id,
        detail: `Mengunggah berkas surat permohonan "${fileName}" untuk kode ${target.bookingCode}.`,
      };

      dispatch({
        type: 'ATTACH_LETTER',
        payload: {
          bookingId,
          fileName: fileName.trim(),
          fileSize,
          mimeType,
          log,
        },
      });

      return {
        ok: true,
        message: `Surat permohonan "${fileName}" berhasil dilampirkan ke reservasi ${target.bookingCode}.`,
        data: {
          ...target,
          letterFileName: fileName.trim(),
          letterFileSize: fileSize,
          letterMimeType: mimeType,
          letterUploadedAt: nowISO,
        },
      };
    },
    [state.bookings]
  );

  const addHolidayBlock = useCallback(
    (
      blockDate: string,
      sessionId: string | null,
      reason: string,
      category: HolidayBlock['category']
    ): ActionResult<HolidayBlock> => {
      if (!blockDate || !reason.trim()) {
        return { ok: false, message: 'Tanggal dan alasan penutupan layanan wajib diisi.' };
      }

      // Cek apakah sudah ada booking aktif pada tanggal/sesi yang hendak diblokir
      const conflictingBooking = state.bookings.find(
        (b) =>
          b.visitDate === blockDate &&
          (sessionId === null || b.sessionId === sessionId) &&
          (b.status === BookingStatus.BOOKED || b.status === BookingStatus.KEEP)
      );

      if (conflictingBooking) {
        return {
          ok: false,
          message: `Tidak dapat memblokir tanggal karena terdapat booking aktif (${conflictingBooking.bookingCode} - ${conflictingBooking.institutionName}). Batalkan atau reschedule terlebih dahulu.`,
          conflictBooking: conflictingBooking,
        };
      }

      const nowISO = new Date().toISOString();
      const block: HolidayBlock = {
        id: `hol-${Date.now()}`,
        blockDate,
        sessionId,
        reason: reason.trim(),
        category,
        createdBy: 'Admin Layanan',
        createdAt: nowISO,
      };

      const log: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: nowISO,
        actor: 'Admin Layanan',
        action: 'BLOCK_HOLIDAY',
        entity: 'holiday_blocks',
        entityId: block.id,
        detail: `Memblokir tanggal ${blockDate} (${sessionId ?? 'Seharian'}): ${block.reason}`,
      };

      dispatch({ type: 'ADD_HOLIDAY_BLOCK', payload: { block, log } });
      return {
        ok: true,
        message: `Tanggal ${blockDate} berhasil ditandai sebagai Libur / Tutup Layanan.`,
        data: block,
      };
    },
    [state.bookings]
  );

  const removeHolidayBlock = useCallback(
    (blockId: string) => {
      const target = state.holidayBlocks.find((h) => h.id === blockId);
      if (!target) return;
      const nowISO = new Date().toISOString();
      const log: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: nowISO,
        actor: 'Admin Layanan',
        action: 'UNBLOCK_HOLIDAY',
        entity: 'holiday_blocks',
        entityId: blockId,
        detail: `Membuka kembali blokir libur tanggal ${target.blockDate}.`,
      };
      dispatch({ type: 'REMOVE_HOLIDAY_BLOCK', payload: { blockId, log } });
    },
    [state.holidayBlocks]
  );

  const updateSessionConfig = useCallback(
    (
      sessionId: string,
      maxCapacity: number,
      idealZoneCapacity: number,
      isActive: boolean
    ): ActionResult<VisitSession> => {
      const target = state.sessions.find((s) => s.id === sessionId);
      if (!target) {
        return { ok: false, message: 'Master sesi tidak ditemukan.' };
      }
      if (maxCapacity < 10 || maxCapacity > 200) {
        return {
          ok: false,
          message: 'Kapasitas maksimal per sesi harus antara 10 hingga 200 peserta.',
        };
      }
      const nowISO = new Date().toISOString();
      const log: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: nowISO,
        actor: 'Admin Sistem',
        action: 'UPDATE_SESSION_CONFIG',
        entity: 'visit_sessions',
        entityId: sessionId,
        detail: `Memperbarui ${target.sessionName}: Kuota=${maxCapacity}, Zona Ideal=${idealZoneCapacity}, Aktif=${isActive ? 'Ya' : 'Tidak'}.`,
      };

      dispatch({
        type: 'UPDATE_SESSION_CONFIG',
        payload: { sessionId, maxCapacity, idealZoneCapacity, isActive, log },
      });

      return {
        ok: true,
        message: `Konfigurasi ${target.sessionName} berhasil diperbarui.`,
        data: { ...target, maxCapacity, idealZoneCapacity, isActive },
      };
    },
    [state.sessions]
  );

  const updateZoneStatus = useCallback(
    (zoneId: string, status: ServiceZone['status']) => {
      const zone = state.serviceZones.find((z) => z.id === zoneId);
      if (!zone) return;
      const nowISO = new Date().toISOString();
      const log: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: nowISO,
        actor: 'Admin Layanan',
        action: 'UPDATE_ZONE_STATUS',
        entity: 'visit_sessions',
        entityId: zoneId,
        detail: `Status kesiapan ${zone.name} diubah menjadi ${status}.`,
      };
      dispatch({ type: 'UPDATE_ZONE_STATUS', payload: { zoneId, status, log } });
    },
    [state.serviceZones]
  );

  const addFacilityIssue = useCallback(
    (
      zoneId: string,
      issueTitle: string,
      priority: FacilityIssue['priority']
    ): ActionResult<FacilityIssue> => {
      if (!issueTitle.trim()) {
        return { ok: false, message: 'Deskripsi kendala fasilitas wajib diisi.' };
      }
      const zone = state.serviceZones.find((z) => z.id === zoneId);
      const nowISO = new Date().toISOString();
      const issue: FacilityIssue = {
        id: `iss-${Date.now()}`,
        zoneId,
        issueTitle: issueTitle.trim(),
        priority,
        status: 'terbuka',
        reportedBy: 'Admin Layanan',
        reportedAt: nowISO,
      };
      const log: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: nowISO,
        actor: 'Admin Layanan',
        action: 'REPORT_FACILITY_ISSUE',
        entity: 'visit_sessions',
        entityId: issue.id,
        detail: `Laporan kendala di ${zone?.name ?? zoneId}: ${issue.issueTitle}.`,
      };
      dispatch({ type: 'ADD_FACILITY_ISSUE', payload: { issue, log } });
      return {
        ok: true,
        message: `Tiket kendala fasilitas untuk ${zone?.name ?? 'zona'} berhasil dicatat.`,
        data: issue,
      };
    },
    [state.serviceZones]
  );

  const resolveFacilityIssue = useCallback(
    (issueId: string) => {
      const target = state.facilityIssues.find((i) => i.id === issueId);
      if (!target) return;
      const nowISO = new Date().toISOString();
      const log: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: nowISO,
        actor: 'Petugas Sarana',
        action: 'RESOLVE_FACILITY_ISSUE',
        entity: 'visit_sessions',
        entityId: issueId,
        detail: `Menyelesaikan kendala: ${target.issueTitle}.`,
      };
      dispatch({ type: 'RESOLVE_FACILITY_ISSUE', payload: { issueId, log } });
    },
    [state.facilityIssues]
  );

  const resetAllData = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Abaikan
    }
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const value = useMemo<SirkusContextValue>(
    () => ({
      state,
      getSlot,
      getDaySlots,
      getMonthlySummary,
      findBookingByCode,
      createBooking,
      updateBookingStatus,
      rescheduleBooking,
      attachBookingLetter,
      addHolidayBlock,
      removeHolidayBlock,
      updateSessionConfig,
      updateZoneStatus,
      addFacilityIssue,
      resolveFacilityIssue,
      resetAllData,
    }),
    [
      state,
      getSlot,
      getDaySlots,
      getMonthlySummary,
      findBookingByCode,
      createBooking,
      updateBookingStatus,
      rescheduleBooking,
      attachBookingLetter,
      addHolidayBlock,
      removeHolidayBlock,
      updateSessionConfig,
      updateZoneStatus,
      addFacilityIssue,
      resolveFacilityIssue,
      resetAllData,
    ]
  );

  return <SirkusContext.Provider value={value}>{children}</SirkusContext.Provider>;
};

export function useSirkus(): SirkusContextValue {
  const ctx = useContext(SirkusContext);
  if (!ctx) {
    throw new Error('useSirkus harus dipanggil di dalam <SirkusProvider>.');
  }
  return ctx;
}

export { DEFAULT_CALENDAR_FOCUS };
