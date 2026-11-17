import React from 'react';
import { ArrowRight, BookOpen, Clock, FileCheck2, ShieldAlert } from 'lucide-react';
import { INSTITUTION_INFO } from '../../config/sirkusConfig';
import { useSirkus } from '../../context/SirkusContext';

interface PublicGuidelinesViewProps {
  onGoToBooking: () => void;
}

export const PublicGuidelinesView: React.FC<PublicGuidelinesViewProps> = ({ onGoToBooking }) => {
  const { state } = useSirkus();

  return (
    <div className="space-y-8">
      <section className="bg-white border border-[#111111] p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-neutral-200">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-neutral-500 mb-1">
              Standar Operasional Prosedur
            </p>
            <h2 className="text-xl font-display font-extrabold tracking-tight text-[#111111]">
              Panduan & Tata Tertib Kunjungan Wisata Baca
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Ketentuan layanan kunjungan edukasi pada {INSTITUTION_INFO.agencyName}.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToBooking}
            className="inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] font-bold text-white bg-[#111111] hover:bg-[#E11D48] rounded-none transition-colors cursor-pointer"
          >
            <span>Ajukan Kunjungan Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs leading-relaxed">
          <div className="border border-neutral-200 p-5 space-y-2.5">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-[#111111]">
              <Clock className="w-4 h-4 text-[#E11D48]" aria-hidden="true" />
              <span>01. Pembagian 2 Kelompok Kunjung Harian</span>
            </div>
            <p className="text-neutral-600">
              Layanan wisata baca dibuka setiap hari kerja ({INSTITUTION_INFO.operationalDays}) pukul{' '}
              <strong className="text-[#111111]">{INSTITUTION_INFO.operationalHours}</strong> dan dibagi menjadi 2 kelompok kunjung harian (bukan sesi per jam):
            </p>
            <ul className="space-y-1 text-[#111111] font-mono tabular-nums">
              <li>• Kelompok Kunjung 1: 08.00 – 12.00 WIB (1 Rombongan + Pemandu Khusus)</li>
              <li>• Kelompok Kunjung 2: 08.00 – 12.00 WIB (1 Rombongan + Rotasi Zona Paralel)</li>
            </ul>
          </div>

          <div className="border border-neutral-200 p-5 space-y-2.5">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-[#111111]">
              <FileCheck2 className="w-4 h-4 text-[#E11D48]" aria-hidden="true" />
              <span>02. Kelengkapan Surat & Batas H-3</span>
            </div>
            <p className="text-neutral-600">
              Pengajuan daring langsung mengunci slot dengan status <strong className="text-[#111111]">Keep / Pending (Kuning)</strong>. Pemohon wajib mengunggah surat permohonan resmi berformat PDF/JPG/PNG paling lambat <strong className="text-[#111111]">H-3 sebelum tanggal kunjungan</strong>. Apabila melewati batas tersebut, slot otomatis dilepas kembali agar dapat digunakan sekolah lain.
            </p>
          </div>

          <div className="border border-neutral-200 p-5 space-y-2.5">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-[#111111]">
              <BookOpen className="w-4 h-4 text-[#E11D48]" aria-hidden="true" />
              <span>03. Kehadiran & Check-in e-Ticket QR</span>
            </div>
            <p className="text-neutral-600">
              Rombongan diharapkan hadir 15 menit sebelum layanan dibuka (07.45 WIB). Guru/PIC wajib menunjukkan <strong className="text-[#111111]">e-Ticket QR Code</strong> (dapat diunduh pada menu Cek Status) kepada petugas lobi untuk pencatatan kehadiran dan jumlah peserta aktual.
            </p>
          </div>

          <div className="border border-neutral-200 p-5 space-y-2.5">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-[#111111]">
              <ShieldAlert className="w-4 h-4 text-[#E11D48]" aria-hidden="true" />
              <span>04. Ketentuan Pendampingan & Ketertiban</span>
            </div>
            <p className="text-neutral-600">
              Setiap 15 siswa PAUD/TK atau SD wajib didampingi minimal 1 guru/pendamping. Rombongan di atas {state.sessions[0]?.idealZoneCapacity ?? 35} peserta akan dibagi menjadi 2 kelompok rotasi zona agar kenyamanan membaca dan keselamatan anak tetap terjaga.
            </p>
          </div>
        </div>
      </section>

      {/* Daftar Zona Layanan yang Dapat Dikunjungi */}
      <section className="bg-white border border-[#111111] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#111111]">
          <h3 className="font-mono text-xs uppercase tracking-[0.12em] font-bold text-[#111111]">
            Zona Layanan Edukasi Tersedia
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
          {state.serviceZones.map((zone) => (
            <div key={zone.id} className="p-6 flex items-center">
              <p className="font-display font-bold text-[#111111] text-sm leading-snug">
                {zone.name}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
