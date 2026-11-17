import React, { useState } from 'react';
import { AdminShell } from './components/admin/AdminShell';
import { PublicBookingFormView } from './components/public/PublicBookingFormView';
import { PublicCalendarView } from './components/public/PublicCalendarView';
import { PublicGuidelinesView } from './components/public/PublicGuidelinesView';
import { PublicTicketCheckView } from './components/public/PublicTicketCheckView';
import { StatusIcon } from './components/StatusIndicator';
import { INSTITUTION_INFO, SLOT_STATUS_CONFIG } from './config/sirkusConfig';
import { DEFAULT_CALENDAR_FOCUS, SirkusProvider } from './context/SirkusContext';
import { PortalMode, PublicTab, SlotStatus } from './types/sirkus';

const PUBLIC_NAV_ITEMS: { id: PublicTab; label: string }[] = [
  { id: 'kalender_publik', label: 'Kalender Publik' },
  { id: 'ajukan_kunjungan', label: 'Ajukan Kunjungan' },
  { id: 'cek_status', label: 'Cek Status & Tiket' },
  { id: 'tata_tertib', label: 'Tata Tertib' },
];

const SirkusWorkspace: React.FC = () => {
  const [portalMode, setPortalMode] = useState<PortalMode>('publik');
  const [publicTab, setPublicTab] = useState<PublicTab>('kalender_publik');

  // Pre-selected slot state when user clicks an available slot on Public Calendar
  const [draftDateISO, setDraftDateISO] = useState<string>(DEFAULT_CALENDAR_FOCUS.todayISO);
  const [draftSessionId, setDraftSessionId] = useState<string>('sesi-2');
  const [lookupBookingCode, setLookupBookingCode] = useState<string>('');

  const handleSelectSlotToBook = (dateISO: string, sessionId: string) => {
    setDraftDateISO(dateISO);
    setDraftSessionId(sessionId);
    setPublicTab('ajukan_kunjungan');
  };

  const handleTrackBookingCode = (code?: string) => {
    if (code) {
      setLookupBookingCode(code);
    }
    setPublicTab('cek_status');
  };

  if (portalMode === 'admin') {
    return <AdminShell onSwitchToPublic={() => setPortalMode('publik')} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD] text-[#111111]">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="bg-[#FDFDFD] border-b-2 border-[#111111] sticky top-0 z-30 print:hidden">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => setPublicTab('kalender_publik')}
            className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-[#111111] whitespace-nowrap shrink-0 cursor-pointer"
          >
            {INSTITUTION_INFO.appName}
          </button>

          {/* Zone 2: 4 single-line navigation links */}
          <nav
            aria-label="Navigasi Portal Publik"
            className="hidden md:flex items-center gap-7 font-mono text-[11px] uppercase tracking-[0.14em]"
          >
            {PUBLIC_NAV_ITEMS.map((item) => {
              const isActive = publicTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPublicTab(item.id)}
                  className={`py-7 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'border-[#E11D48] text-[#111111] font-bold'
                      : 'border-transparent text-neutral-500 hover:text-[#111111]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setPortalMode('admin')}
              className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] font-bold text-white bg-[#111111] border border-[#111111] hover:bg-[#E11D48] hover:border-[#E11D48] rounded-none transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Dashboard Admin
            </button>
          </div>
        </div>

        {/* Mobile sub-nav */}
        <div className="md:hidden border-t border-neutral-200 px-4 py-2 flex items-center gap-2 overflow-x-auto bg-[#FDFDFD]">
          {PUBLIC_NAV_ITEMS.map((item) => {
            const isActive = publicTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPublicTab(item.id)}
                className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] rounded-none border whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#111111] text-white border-[#111111] font-bold'
                    : 'text-neutral-600 bg-white border-neutral-300 hover:text-[#111111]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
        {/* Editorial Masthead & Operational Ribbon (Variation 1) */}
        <section className="border-b border-neutral-200 pb-8 space-y-6 print:hidden">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-500">
                01. Sistem Reservasi · {INSTITUTION_INFO.agencyName}
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-[-0.04em] leading-[0.92] text-[#111111] text-balance">
                WISATA BACA.
              </h1>
              <p className="text-sm text-neutral-600 leading-relaxed max-w-xl">
                {INSTITUTION_INFO.fullTitle} terintegrasi dengan pembagian 2 kelompok kunjung harian (jam layanan {INSTITUTION_INFO.operationalHours}) dan proteksi anti-bentrok otomatis.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-6 gap-y-3 text-xs border-t lg:border-t-0 pt-4 lg:pt-0 border-neutral-200 tabular-nums shrink-0">
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                  Jam Layanan
                </span>
                <span className="font-mono font-bold text-[#111111]">
                  {INSTITUTION_INFO.operationalHours}
                </span>
              </div>
              <div className="border-l border-neutral-200 pl-4">
                <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                  Kuota Harian
                </span>
                <span className="font-mono font-bold text-[#111111]">2 Kelompok Kunjung</span>
              </div>
              <div className="border-l border-neutral-200 pl-4">
                <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                  Batas Slot
                </span>
                <span className="font-mono font-bold text-[#111111]">1 Rombongan / Kelompok</span>
              </div>
            </div>
          </div>

          {/* Semantic Status Legend */}
          <div className="pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                Status Slot:
              </span>
              {(
                [
                  SlotStatus.AVAILABLE,
                  SlotStatus.KEEP,
                  SlotStatus.BOOKED,
                  SlotStatus.HOLIDAY,
                ] as SlotStatus[]
              ).map((status) => {
                const meta = SLOT_STATUS_CONFIG[status];
                return (
                  <span
                    key={status}
                    className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] ${meta.textClass}`}
                  >
                    <span className={`w-2 h-2 ${meta.dotClass}`} aria-hidden="true" />
                    <StatusIcon status={status} className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {meta.label} ({meta.colorName})
                    </span>
                  </span>
                );
              })}
            </div>

            <span className="font-mono text-[11px] text-neutral-500">
              2 Kelompok Kunjung / Hari · Batas Unggah Surat H-3
            </span>
          </div>
        </section>

        {/* Active Public Tab */}
        {publicTab === 'kalender_publik' && (
          <PublicCalendarView
            onSelectSlotToBook={handleSelectSlotToBook}
            onGoToCheckStatus={handleTrackBookingCode}
          />
        )}
        {publicTab === 'ajukan_kunjungan' && (
          <PublicBookingFormView
            initialDateISO={draftDateISO}
            initialSessionId={draftSessionId}
            onBackToCalendar={() => setPublicTab('kalender_publik')}
            onTrackBookingCode={handleTrackBookingCode}
          />
        )}
        {publicTab === 'cek_status' && (
          <PublicTicketCheckView
            initialBookingCode={lookupBookingCode}
            onGoToBooking={() => setPublicTab('ajukan_kunjungan')}
          />
        )}
        {publicTab === 'tata_tertib' && (
          <PublicGuidelinesView onGoToBooking={() => setPublicTab('ajukan_kunjungan')} />
        )}
      </main>

      <footer className="bg-[#FDFDFD] border-t-2 border-[#111111] mt-12 print:hidden">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-neutral-500">
          <span>
            &copy; 2026 {INSTITUTION_INFO.appName} — {INSTITUTION_INFO.agencyName}
          </span>
          <span className="normal-case tracking-normal font-sans text-xs text-neutral-600">
            &ldquo;{INSTITUTION_INFO.tagline}&rdquo;
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <SirkusProvider>
      <SirkusWorkspace />
    </SirkusProvider>
  );
}
