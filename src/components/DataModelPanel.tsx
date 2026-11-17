import React, { useState } from 'react';
import { Database, RotateCcw } from 'lucide-react';
import { SLOT_STATUS_CONFIG } from '../config/sirkusConfig';
import { useSirkus } from '../context/SirkusContext';
import { SlotStatus } from '../types/sirkus';

type EntityViewKey = 'visit_sessions' | 'visit_bookings' | 'holiday_blocks' | 'service_zones' | 'audit_logs';

const ENTITY_SCHEMA_SPEC: Record<
  EntityViewKey,
  { title: string; fields: string; description: string }
> = {
  visit_sessions: {
    title: 'visit_sessions (Master Kelompok Kunjung)',
    fields: 'id, session_code, session_name (Kelompok Kunjung 1 / 2), start_time (08:00), end_time (12:00), max_capacity, ideal_zone_capacity, is_active',
    description: 'Mengunci jam layanan operasional 08.00–12.00 WIB ke dalam tepat 2 kelompok kunjung harian (bukan sesi per jam).',
  },
  visit_bookings: {
    title: 'visit_bookings (Transaksi Reservasi)',
    fields: 'id, booking_code (UNIQUE), institution_name, education_level, pic_name, pic_phone, pic_email, visit_date, session_id, planned_participants, activity_focus, letter_file_name, status, hold_expires_at',
    description: 'Menyimpan seluruh reservasi dengan constraint anti-bentrok pada pasangan (visit_date, session_id).',
  },
  holiday_blocks: {
    title: 'holiday_blocks (Blokir Libur)',
    fields: 'id, block_date, session_id (nullable), reason, category, created_by',
    description: 'Menandai tanggal libur nasional, cuti bersama, atau tutup sesi khusus menjadi status Abu-abu (Libur).',
  },
  service_zones: {
    title: 'service_zones (Master Zona Ruang)',
    fields: 'id, code, name, location, capacity, facilities[], status',
    description: 'Daftar ruang layanan edukasi (Ruang Baca Anak, Ruang BOLAM, Ruang Baca Umum / Peminjaman, Galeri Arsip dan Sejarah Daerah).',
  },
  audit_logs: {
    title: 'audit_logs (Jejak Perubahan State)',
    fields: 'id, timestamp, actor, action, entity, entity_id, detail',
    description: 'Mencatat setiap aksi keep slot, approval, pelepasan slot, perubahan kuota, dan blokir libur.',
  },
};

export const DataModelPanel: React.FC = () => {
  const { state, resetAllData } = useSirkus();
  const [selectedEntity, setSelectedEntity] = useState<EntityViewKey>('visit_sessions');
  const [resetDone, setResetDone] = useState(false);

  const entityDataMap: Record<EntityViewKey, unknown> = {
    visit_sessions: state.sessions,
    visit_bookings: state.bookings,
    holiday_blocks: state.holidayBlocks,
    service_zones: state.serviceZones,
    audit_logs: state.auditLogs,
  };

  const handleReset = () => {
    resetAllData();
    setResetDone(true);
    window.setTimeout(() => setResetDone(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Ringkasan Aturan Warna Status & Arsitektur */}
      <div className="bg-white border border-[#111111] rounded-none p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#111111]">
          <div>
            <h2 className="text-base font-display font-extrabold text-[#111111] tracking-tight">
              Konfigurasi Utama, Status Slot & Skema Data Model (PRD Lampiran C)
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Fondasi state management terpusat (React Context + useReducer + localStorage persistence) yang terhubung ke Portal Publik & Dashboard Admin.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-[#111111] bg-white border border-[#111111] hover:bg-[#E11D48] hover:text-white hover:border-[#E11D48] rounded-none transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{resetDone ? 'State Berhasil Direset' : 'Reset State ke Seed Awal'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#111111] divide-y sm:divide-y-0 sm:divide-x divide-[#111111]">
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
              <div key={status} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-bold text-[#111111]">
                    {meta.label}
                  </span>
                  <span className={`w-3 h-3 rounded-none ${meta.dotClass}`} aria-hidden="true" />
                </div>
                <p className="text-[11px] font-mono text-neutral-500">
                  Warna: {meta.colorName} · enum: &quot;{meta.status}&quot;
                </p>
                <p className="text-xs text-neutral-600 leading-relaxed">{meta.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive State Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-white border border-[#111111] rounded-none overflow-hidden">
          <div className="px-4 py-3 border-b border-[#111111] bg-neutral-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#E11D48]" aria-hidden="true" />
            <h3 className="text-[11px] font-mono uppercase tracking-[0.08em] font-bold text-[#111111]">
              Entitas State Terpusat
            </h3>
          </div>
          <div className="divide-y divide-neutral-200">
            {(Object.keys(ENTITY_SCHEMA_SPEC) as EntityViewKey[]).map((key) => {
              const spec = ENTITY_SCHEMA_SPEC[key];
              const count = (entityDataMap[key] as unknown[]).length;
              const isSelected = selectedEntity === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedEntity(key)}
                  className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#111111] text-white' : 'hover:bg-neutral-50 text-[#111111]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold">{key}</span>
                    <span
                      className={`text-[11px] font-mono tabular-nums ${
                        isSelected ? 'text-[#E11D48]' : 'text-neutral-500'
                      }`}
                    >
                      {count} records
                    </span>
                  </div>
                  <p
                    className={`text-[11px] mt-1 leading-relaxed ${
                      isSelected ? 'text-neutral-300' : 'text-neutral-500'
                    }`}
                  >
                    {spec.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white border border-[#111111] rounded-none overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#111111] flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-display font-bold text-[#111111]">
                {ENTITY_SCHEMA_SPEC[selectedEntity].title}
              </h3>
              <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
                Kolom: {ENTITY_SCHEMA_SPEC[selectedEntity].fields}
              </p>
            </div>
          </div>

          <pre className="p-4 bg-[#111111] text-neutral-100 text-xs font-mono overflow-x-auto max-h-[460px] leading-relaxed">
            {JSON.stringify(entityDataMap[selectedEntity], null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
