import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  Database,
  DoorOpen,
  FileSpreadsheet,
  LayoutDashboard,
  ListChecks,
  Menu,
  Plus,
  Settings,
  X,
} from 'lucide-react';
import { INSTITUTION_INFO } from '../../config/sirkusConfig';
import { useSirkus } from '../../context/SirkusContext';
import { AdminMenuKey, BookingStatus } from '../../types/sirkus';
import { CalendarOverviewPanel } from '../CalendarOverviewPanel';
import { DataModelPanel } from '../DataModelPanel';
import { MasterSessionPanel } from '../MasterSessionPanel';
import { AdminAnalyticsView } from './AdminAnalyticsView';
import { AdminDashboardOverview } from './AdminDashboardOverview';
import { AdminReportsView } from './AdminReportsView';
import { AdminReservationsView } from './AdminReservationsView';
import { ManualBookingModal } from './ManualBookingModal';
import { RoomReadinessView } from './RoomReadinessView';
import { VerificationQueueView } from './VerificationQueueView';

interface AdminShellProps {
  onSwitchToPublic: () => void;
}

interface SidebarItem {
  id: AdminMenuKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ADMIN_MENU_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'kalender_jadwal', label: 'Kalender Jadwal', icon: CalendarDays },
  { id: 'daftar_reservasi', label: 'Daftar Reservasi', icon: ListChecks },
  { id: 'verifikasi_surat', label: 'Verifikasi Surat', icon: ClipboardCheck },
  { id: 'kesiapan_ruang', label: 'Kesiapan Ruang', icon: DoorOpen },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'laporan', label: 'Laporan', icon: FileSpreadsheet },
  { id: 'pengaturan', label: 'Pengaturan Sesi', icon: Settings },
];

export const AdminShell: React.FC<AdminShellProps> = ({ onSwitchToPublic }) => {
  const { state } = useSirkus();
  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'sesi' | 'model'>('sesi');

  const pendingVerificationCount = useMemo(
    () =>
      state.bookings.filter(
        (b) => b.status === BookingStatus.KEEP || b.status === BookingStatus.REVISION
      ).length,
    [state.bookings]
  );

  const activeMenuItem =
    ADMIN_MENU_ITEMS.find((item) => item.id === activeMenu) ?? ADMIN_MENU_ITEMS[0];

  const handleSelectMenu = (menu: AdminMenuKey) => {
    setActiveMenu(menu);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-[#FDFDFD] text-[#111111]">
      {/* Desktop Left Sidebar (256px) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 bg-[#111111] text-white border-r border-[#111111] print:hidden">
        <div className="h-20 px-6 flex items-center border-b border-white/15">
          <button
            type="button"
            onClick={() => handleSelectMenu('dashboard')}
            className="text-left cursor-pointer"
          >
            <span className="text-lg font-display font-extrabold tracking-tight text-white block">
              {INSTITUTION_INFO.appName}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400 block mt-0.5">
              Dashboard Pengelola
            </span>
          </button>
        </div>

        <nav aria-label="Menu Admin" className="flex-1 px-3 py-5 space-y-1">
          {ADMIN_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectMenu(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] rounded-none transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#111111] font-bold'
                    : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="inline-flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'verifikasi_surat' && pendingVerificationCount > 0 && (
                  <span
                    className={`font-mono text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-none ${
                      isActive
                        ? 'bg-[#E11D48] text-white'
                        : 'bg-[#E11D48] text-white'
                    }`}
                  >
                    {pendingVerificationCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-5 border-t border-white/15 space-y-1.5 text-[11px] text-neutral-300">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] font-bold text-white">
            Ketentuan Layanan Aktif
          </p>
          <p className="font-mono tabular-nums text-neutral-400">Jam: 08.00 – 12.00 WIB</p>
          <p className="font-mono tabular-nums text-neutral-400">Kuota: 2 Kelompok Kunjung / Hari</p>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-[#111111] text-white flex flex-col z-50">
            <div className="h-20 px-4 flex items-center justify-between border-b border-white/15">
              <span className="text-base font-display font-extrabold">{INSTITUTION_INFO.appName}</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Tutup menu"
                className="p-1.5 text-neutral-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {ADMIN_MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectMenu(item.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] rounded-none cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#111111] font-bold'
                        : 'text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </span>
                    {item.id === 'verifikasi_surat' && pendingVerificationCount > 0 && (
                      <span className="font-mono text-[10px] font-bold tabular-nums px-1.5 py-0.5 bg-[#E11D48] text-white">
                        {pendingVerificationCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Workspace Header Bar */}
        <header className="h-20 bg-[#FDFDFD] border-b-2 border-[#111111] px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka navigasi admin"
              className="lg:hidden p-2 text-[#111111] border border-neutral-300 hover:border-[#111111] rounded-none cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm truncate">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500 hidden sm:inline">
                Admin Layanan
              </span>
              <span className="text-neutral-300 hidden sm:inline">/</span>
              <h1 className="font-display font-extrabold tracking-tight text-[#111111] truncate text-lg">
                {activeMenuItem.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setManualModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] rounded-none whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Input Manual</span>
            </button>
            <button
              type="button"
              onClick={onSwitchToPublic}
              className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] font-bold text-[#111111] bg-white border border-[#111111] hover:bg-neutral-100 rounded-none whitespace-nowrap cursor-pointer"
            >
              Portal Publik
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1360px] w-full mx-auto space-y-6">
          {activeMenu === 'dashboard' && (
            <AdminDashboardOverview
              onNavigate={handleSelectMenu}
              onOpenManualBooking={() => setManualModalOpen(true)}
            />
          )}
          {activeMenu === 'kalender_jadwal' && <CalendarOverviewPanel />}
          {activeMenu === 'daftar_reservasi' && (
            <AdminReservationsView
              onOpenManualBooking={() => setManualModalOpen(true)}
              onGoToVerification={() => handleSelectMenu('verifikasi_surat')}
            />
          )}
          {activeMenu === 'verifikasi_surat' && <VerificationQueueView />}
          {activeMenu === 'kesiapan_ruang' && <RoomReadinessView />}
          {activeMenu === 'analytics' && <AdminAnalyticsView />}
          {activeMenu === 'laporan' && <AdminReportsView />}
          {activeMenu === 'pengaturan' && (
            <div className="space-y-4">
              <div className="flex items-center border border-[#111111] w-fit">
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('sesi')}
                  className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] cursor-pointer ${
                    settingsSubTab === 'sesi'
                      ? 'bg-[#111111] text-white font-bold'
                      : 'bg-white text-neutral-600 hover:text-[#111111]'
                  }`}
                >
                  Master Sesi & Blokir Libur
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('model')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] border-l border-[#111111] cursor-pointer ${
                    settingsSubTab === 'model'
                      ? 'bg-[#111111] text-white font-bold'
                      : 'bg-white text-neutral-600 hover:text-[#111111]'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Model Data & Reset State</span>
                </button>
              </div>
              {settingsSubTab === 'sesi' ? <MasterSessionPanel /> : <DataModelPanel />}
            </div>
          )}
        </main>
      </div>

      <ManualBookingModal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
      />
    </div>
  );
};
