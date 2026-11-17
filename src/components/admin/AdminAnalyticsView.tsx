import React, { useMemo } from 'react';
import { BarChart3, Lightbulb } from 'lucide-react';
import { EDUCATION_LEVEL_OPTIONS } from '../../config/sirkusConfig';
import { DEFAULT_CALENDAR_FOCUS, useSirkus } from '../../context/SirkusContext';
import { BookingStatus } from '../../types/sirkus';
import { parseISODateLocal } from '../../utils/bookingUtils';

const HARI_KERJA = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export const AdminAnalyticsView: React.FC = () => {
  const { state, getMonthlySummary } = useSirkus();

  const monthlySummary = useMemo(
    () =>
      getMonthlySummary(DEFAULT_CALENDAR_FOCUS.year, DEFAULT_CALENDAR_FOCUS.monthIndex),
    [getMonthlySummary]
  );

  const activeBookings = useMemo(
    () =>
      state.bookings.filter(
        (b) =>
          b.status === BookingStatus.BOOKED ||
          b.status === BookingStatus.KEEP ||
          b.status === BookingStatus.COMPLETED
      ),
    [state.bookings]
  );

  const sessionComparison = useMemo(() => {
    const s1Count = activeBookings.filter((b) => b.sessionId === 'sesi-1').length;
    const s2Count = activeBookings.filter((b) => b.sessionId === 'sesi-2').length;
    const totalWorkingPerSession = Math.max(1, Math.round(monthlySummary.totalWorkingSlots / 2));
    return {
      s1Count,
      s2Count,
      s1Pct: Math.min(100, Math.round((s1Count / totalWorkingPerSession) * 100)),
      s2Pct: Math.min(100, Math.round((s2Count / totalWorkingPerSession) * 100)),
    };
  }, [activeBookings, monthlySummary.totalWorkingSlots]);

  const educationStats = useMemo(() => {
    const total = Math.max(1, activeBookings.length);
    return EDUCATION_LEVEL_OPTIONS.map((level) => {
      const matching = activeBookings.filter((b) => b.educationLevel === level);
      const participants = matching.reduce((acc, cur) => acc + cur.plannedParticipants, 0);
      return {
        level,
        groups: matching.length,
        participants,
        percent: Math.round((matching.length / total) * 100),
      };
    });
  }, [activeBookings]);

  const weekdayStats = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // Sen..Jum
    for (const b of activeBookings) {
      const day = parseISODateLocal(b.visitDate).getDay(); // 1..5
      if (day >= 1 && day <= 5) {
        counts[day - 1] += 1;
      }
    }
    const maxCount = Math.max(1, ...counts);
    return HARI_KERJA.map((name, idx) => ({
      name,
      count: counts[idx],
      widthPct: Math.round((counts[idx] / maxCount) * 100),
    }));
  }, [activeBookings]);

  const dynamicInsights = useMemo(() => {
    const insights: string[] = [];

    if (sessionComparison.s1Count > sessionComparison.s2Count) {
      insights.push(
        `Kelompok Kunjung 1 mencatat okupansi lebih tinggi (${sessionComparison.s1Count} rombongan) dibandingkan Kelompok Kunjung 2 (${sessionComparison.s2Count} rombongan). Arahkan pendaftar baru pada hari sibuk ke Kelompok Kunjung 2 untuk pemerataan rotasi zona.`
      );
    } else {
      insights.push(
        `Distribusi kunjungan antara Kelompok Kunjung 1 (${sessionComparison.s1Count} rombongan) dan Kelompok Kunjung 2 (${sessionComparison.s2Count} rombongan) tergolong seimbang.`
      );
    }

    const peakDay = [...weekdayStats].sort((a, b) => b.count - a.count)[0];
    if (peakDay && peakDay.count > 0) {
      insights.push(
        `Hari ${peakDay.name} menjadi hari kunjungan terpadat saat ini dengan ${peakDay.count} rombongan terjadwal.`
      );
    }

    const pendingNoLetter = activeBookings.filter(
      (b) => b.status === BookingStatus.KEEP && !b.letterFileName
    ).length;
    if (pendingNoLetter > 0) {
      insights.push(
        `Terdapat ${pendingNoLetter} reservasi berstatus Keep (Kuning) yang belum melampirkan surat permohonan resmi; pantau batas waktu H-3.`
      );
    }

    const overIdeal = activeBookings.filter(
      (b) => b.plannedParticipants > (state.sessions[0]?.idealZoneCapacity ?? 35)
    ).length;
    if (overIdeal > 0) {
      insights.push(
        `${overIdeal} rombongan memiliki peserta di atas kapasitas ideal satu zona (${
          state.sessions[0]?.idealZoneCapacity ?? 35
        } orang) sehingga direkomendasikan rotasi 2 sub-kelompok saat tur.`
      );
    }

    return insights;
  }, [sessionComparison, weekdayStats, activeBookings, state.sessions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Perbandingan Okupansi Kelompok Kunjung 1 vs 2 */}
        <div className="lg:col-span-6 bg-white border border-[#111111] rounded-none p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div>
              <h2 className="text-sm font-display font-bold text-[#111111]">
                Perbandingan Okupansi Kelompok Kunjung 1 vs 2
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Distribusi keterisian 2 slot kelompok kunjung harian pada jam layanan 08.00–12.00 WIB.
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-[#E11D48]" aria-hidden="true" />
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#111111]">
                  Kelompok Kunjung 1 (08.00 – 12.00 WIB)
                </span>
                <span className="font-mono font-bold text-[#111111] tabular-nums">
                  {sessionComparison.s1Count} rombongan ({sessionComparison.s1Pct}%)
                </span>
              </div>
              <div className="w-full h-3 bg-neutral-100 border border-neutral-200 rounded-none overflow-hidden">
                <div
                  className="h-full bg-[#111111] rounded-none transition-all"
                  style={{ width: `${sessionComparison.s1Pct}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#111111]">
                  Kelompok Kunjung 2 (08.00 – 12.00 WIB)
                </span>
                <span className="font-mono font-bold text-[#E11D48] tabular-nums">
                  {sessionComparison.s2Count} rombongan ({sessionComparison.s2Pct}%)
                </span>
              </div>
              <div className="w-full h-3 bg-neutral-100 border border-neutral-200 rounded-none overflow-hidden">
                <div
                  className="h-full bg-[#E11D48] rounded-none transition-all"
                  style={{ width: `${sessionComparison.s2Pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tren Hari Terpadat */}
          <div className="pt-4 border-t border-neutral-200 space-y-3">
            <h3 className="text-[11px] font-mono uppercase tracking-[0.08em] font-bold text-neutral-600">
              Distribusi Kunjungan per Hari Kerja (Peak Days)
            </h3>
            <div className="space-y-2 text-xs">
              {weekdayStats.map((day) => (
                <div key={day.name} className="flex items-center gap-3">
                  <span className="w-14 text-neutral-700 font-medium">{day.name}</span>
                  <div className="flex-1 h-2.5 bg-neutral-100 border border-neutral-200 rounded-none overflow-hidden">
                    <div
                      className="h-full bg-emerald-700 rounded-none"
                      style={{ width: `${day.widthPct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono font-semibold text-[#111111] tabular-nums">
                    {day.count} sesi
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demografi Jenjang Pemustaka */}
        <div className="lg:col-span-6 bg-white border border-[#111111] rounded-none p-6 space-y-4">
          <div className="pb-3 border-b border-neutral-200">
            <h2 className="text-sm font-display font-bold text-[#111111]">
              Demografi Pemustaka per Jenjang Pendidikan
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Sebaran rombongan aktif berdasarkan kategori instansi pengunjung.
            </p>
          </div>

          <div className="divide-y divide-neutral-200 text-xs">
            {educationStats.map((item) => (
              <div key={item.level} className="py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#111111]">{item.level}</span>
                  <span className="font-mono text-neutral-600 tabular-nums">
                    {item.groups} rombongan · {item.participants} peserta ({item.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-100 border border-neutral-200 rounded-none overflow-hidden">
                  <div
                    className="h-full bg-[#111111] rounded-none"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insight & Rekomendasi Layanan Otomatis */}
      <div className="bg-white border border-[#111111] rounded-none p-6 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-200">
          <Lightbulb className="w-4 h-4 text-[#E11D48]" aria-hidden="true" />
          <h3 className="text-sm font-display font-bold text-[#111111]">
            Insight & Rekomendasi Operasional Otomatis
          </h3>
        </div>
        <ul className="space-y-2 text-xs text-neutral-700 leading-relaxed">
          {dynamicInsights.map((insight, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="font-mono font-bold text-[#E11D48] shrink-0 tabular-nums">
                0{idx + 1}.
              </span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
