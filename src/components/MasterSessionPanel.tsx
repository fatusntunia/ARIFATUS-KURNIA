import React, { useState } from 'react';
import { CalendarOff, CheckCircle2, Clock, Plus, Trash2 } from 'lucide-react';
import { INSTITUTION_INFO } from '../config/sirkusConfig';
import { useSirkus } from '../context/SirkusContext';
import { HolidayBlock, VisitSession } from '../types/sirkus';
import { formatHariTanggalID } from '../utils/bookingUtils';

const CATEGORY_LABELS: Record<HolidayBlock['category'], string> = {
  libur_nasional: 'Libur Nasional',
  cuti_bersama: 'Cuti Bersama',
  pemeliharaan_internal: 'Pemeliharaan / Internal Dinas',
  akhir_pekan: 'Akhir Pekan',
};

export const MasterSessionPanel: React.FC = () => {
  const { state, updateSessionConfig, addHolidayBlock, removeHolidayBlock } = useSirkus();

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [draftMaxCapacity, setDraftMaxCapacity] = useState<number>(60);
  const [draftIdealCapacity, setDraftIdealCapacity] = useState<number>(35);
  const [draftIsActive, setDraftIsActive] = useState<boolean>(true);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  // Form blokir libur
  const [blockDate, setBlockDate] = useState('2026-11-30');
  const [blockSessionId, setBlockSessionId] = useState<string>('ALL');
  const [blockReason, setBlockReason] = useState('');
  const [blockCategory, setBlockCategory] =
    useState<HolidayBlock['category']>('pemeliharaan_internal');
  const [holidayFeedback, setHolidayFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const startEditSession = (session: VisitSession) => {
    setEditingSessionId(session.id);
    setDraftMaxCapacity(session.maxCapacity);
    setDraftIdealCapacity(session.idealZoneCapacity);
    setDraftIsActive(session.isActive);
    setSessionNotice(null);
  };

  const handleSaveSession = (sessionId: string) => {
    const res = updateSessionConfig(
      sessionId,
      Number(draftMaxCapacity),
      Number(draftIdealCapacity),
      draftIsActive
    );
    setSessionNotice(res.message);
    if (res.ok) {
      setEditingSessionId(null);
    }
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addHolidayBlock(
      blockDate,
      blockSessionId === 'ALL' ? null : blockSessionId,
      blockReason,
      blockCategory
    );
    setHolidayFeedback({
      type: res.ok ? 'success' : 'error',
      message: res.message,
    });
    if (res.ok) {
      setBlockReason('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Bagian 1: Konfigurasi Master Sesi 08.00 - 12.00 WIB */}
      <div className="bg-white border border-[#111111] rounded-none overflow-hidden">
        <div className="px-6 py-4 border-b border-[#111111] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-display font-extrabold text-[#111111] tracking-tight">
              Master Kelompok Kunjung Harian (Jam Operasional {INSTITUTION_INFO.operationalHours})
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Operasional wisata baca dibagi ketat menjadi 2 kelompok kunjung harian (bukan sesi per jam). Perubahan kuota atau status aktif langsung memengaruhi kalender slot.
            </p>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-[0.08em] font-bold text-[#111111] border border-[#111111] px-2.5 py-1 bg-[#FDFDFD] tabular-nums">
            Batas Unggah Surat: H-{INSTITUTION_INFO.autoReleaseDeadlineDays}
          </span>
        </div>

        {sessionNotice && (
          <div className="mx-6 mt-4 p-3 rounded-none bg-emerald-50 border border-emerald-700 text-xs text-emerald-950 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>{sessionNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#111111]">
          {state.sessions.map((session) => {
            const isEditing = editingSessionId === session.id;
            return (
              <div key={session.id} className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 tabular-nums">
                      <span className="font-bold text-[#E11D48]">{session.sessionCode}</span>
                      <span aria-hidden="true">·</span>
                      <span>{session.timeLabel}</span>
                    </div>
                    <h3 className="mt-1 text-lg font-display font-extrabold text-[#111111]">
                      {session.sessionName}
                    </h3>
                  </div>

                  <span
                    className={`text-[11px] font-mono uppercase tracking-[0.06em] font-bold px-2.5 py-1 rounded-none border whitespace-nowrap ${
                      session.isActive
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-700'
                        : 'bg-neutral-100 text-neutral-600 border-neutral-400'
                    }`}
                  >
                    {session.isActive ? 'Aktif Dibuka' : 'Ditutup (Libur)'}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">{session.description}</p>

                {!isEditing ? (
                  <div className="pt-3 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6 text-xs">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                          Kuota Maksimal
                        </span>
                        <span className="font-mono font-bold text-[#111111] tabular-nums">
                          {session.maxCapacity} peserta
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                          Batas Ideal Zona
                        </span>
                        <span className="font-mono font-bold text-[#111111] tabular-nums">
                          {session.idealZoneCapacity} peserta
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                          Jam Layanan
                        </span>
                        <span className="font-mono font-bold text-[#111111] tabular-nums inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-500" />
                          08.00–12.00 WIB
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => startEditSession(session)}
                      className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-[#111111] bg-white border border-[#111111] hover:bg-[#111111] hover:text-white rounded-none transition-colors cursor-pointer"
                    >
                      Ubah Kuota / Status
                    </button>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-neutral-200 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
                          Kuota Maksimal Sesi
                        </label>
                        <input
                          type="number"
                          min={10}
                          max={200}
                          value={draftMaxCapacity}
                          onChange={(e) => setDraftMaxCapacity(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs border border-[#111111] rounded-none tabular-nums focus:outline-none focus:border-[#E11D48]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
                          Batas Ideal per Zona
                        </label>
                        <input
                          type="number"
                          min={10}
                          max={100}
                          value={draftIdealCapacity}
                          onChange={(e) => setDraftIdealCapacity(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs border border-[#111111] rounded-none tabular-nums focus:outline-none focus:border-[#E11D48]"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftIsActive}
                        onChange={(e) => setDraftIsActive(e.target.checked)}
                        className="rounded-none border-[#111111] text-[#111111] focus:ring-[#E11D48]"
                      />
                      <span>Sesi ini aktif menerima reservasi kunjungan</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveSession(session.id)}
                        className="px-3 py-1.5 text-[11px] font-mono uppercase font-bold text-white bg-[#111111] hover:bg-[#E11D48] rounded-none cursor-pointer transition-colors"
                      >
                        Simpan Konfigurasi
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSessionId(null)}
                        className="px-3 py-1.5 text-[11px] font-mono uppercase font-bold text-[#111111] bg-white border border-[#111111] hover:bg-neutral-100 rounded-none cursor-pointer transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bagian 2: Holiday Blocks (Status Libur = Abu-abu) & Zona Layanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-[#111111] rounded-none overflow-hidden">
          <div className="px-5 py-4 border-b border-[#111111] flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-display font-bold text-[#111111]">
                Daftar Blokir Tanggal Libur / Tutup Layanan (Abu-abu)
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Selain Sabtu & Minggu, admin dapat menutup tanggal/sesi tertentu untuk libur nasional atau pemeliharaan.
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-500 tabular-nums shrink-0">
              {state.holidayBlocks.length} entri
            </span>
          </div>

          <form onSubmit={handleAddHoliday} className="p-5 bg-[#FDFDFD] border-b border-[#111111] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#111111] rounded-none tabular-nums focus:outline-none focus:border-[#E11D48]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
                  Cakupan Sesi
                </label>
                <select
                  value={blockSessionId}
                  onChange={(e) => setBlockSessionId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#111111] rounded-none focus:outline-none focus:border-[#E11D48]"
                >
                  <option value="ALL">Seharian (Kelompok 1 &amp; Kelompok 2)</option>
                  {state.sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      Khusus {s.sessionName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-[0.06em] text-neutral-700 mb-1">
                  Kategori
                </label>
                <select
                  value={blockCategory}
                  onChange={(e) => setBlockCategory(e.target.value as HolidayBlock['category'])}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#111111] rounded-none focus:outline-none focus:border-[#E11D48]"
                >
                  <option value="libur_nasional">Libur Nasional</option>
                  <option value="cuti_bersama">Cuti Bersama</option>
                  <option value="pemeliharaan_internal">Pemeliharaan / Internal</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Alasan penutupan layanan (misal: Pemeliharaan Ruang Audiovisual)"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#111111] rounded-none focus:outline-none focus:border-[#E11D48]"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] rounded-none whitespace-nowrap cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Tambah Blokir Libur</span>
              </button>
            </div>

            {holidayFeedback && (
              <p
                className={`text-xs px-3 py-2 rounded-none border ${
                  holidayFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-700 text-emerald-900'
                    : 'bg-rose-50 border-[#E11D48] text-rose-950'
                }`}
              >
                {holidayFeedback.message}
              </p>
            )}
          </form>

          <div className="divide-y divide-neutral-200">
            {state.holidayBlocks.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500">
                Belum ada blokir tanggal khusus. Hanya akhir pekan (Sabtu–Minggu) yang berstatus Libur.
              </div>
            ) : (
              state.holidayBlocks.map((block) => {
                const targetSession = state.sessions.find((s) => s.id === block.sessionId);
                return (
                  <div
                    key={block.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <CalendarOff className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span className="font-semibold text-[#111111] tabular-nums">
                          {formatHariTanggalID(block.blockDate)}
                        </span>
                        <span aria-hidden="true" className="text-neutral-400">·</span>
                        <span className="text-neutral-700">
                          {targetSession ? targetSession.sessionName : 'Seharian (Kelompok 1 & 2)'}
                        </span>
                        <span aria-hidden="true" className="text-neutral-400">·</span>
                        <span className="font-mono text-[11px] text-neutral-500">
                          {CATEGORY_LABELS[block.category]}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-1">{block.reason}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeHolidayBlock(block.id)}
                      aria-label={`Hapus blokir ${block.blockDate}`}
                      className="p-1.5 text-neutral-500 hover:text-[#E11D48] hover:bg-rose-50 rounded-none transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Zona Layanan Wisata Baca */}
        <div className="lg:col-span-5 bg-white border border-[#111111] rounded-none overflow-hidden">
          <div className="px-5 py-4 border-b border-[#111111]">
            <h3 className="text-sm font-display font-bold text-[#111111]">
              Zona Layanan Edukasi Tersedia
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Daftar ruang layanan edukasi wisata baca yang beroperasi pada sesi kunjungan.
            </p>
          </div>
          <div className="divide-y divide-neutral-200">
            {state.serviceZones.map((zone, idx) => (
              <div key={zone.id} className="px-5 py-3.5 flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-[#E11D48] tabular-nums">
                  0{idx + 1}.
                </span>
                <p className="text-xs font-semibold text-[#111111]">{zone.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
