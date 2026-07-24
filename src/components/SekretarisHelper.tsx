import React from 'react';
import { Santri, Surat } from '../types';

export interface PesantrenProfile {
  namaPesantren: string;
  namaYayasan: string;
  nspp: string;
  nomorNotaris: string;
  alamat: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  namaPengasuh: string;
  namaWakilPengasuh: string;
  namaKetuaYayasan: string;
  namaKetuaPondok: string;
  namaSekretaris: string;
  namaBendahara: string;
  namaKetuaKeamanan: string;
  namaKetuaPendidikan: string;
  kotaTandaTangan: string;
  logoStyle: 'classic' | 'elegant' | 'modern';
  kopTambahan1: string;
  kopTambahan2: string;
  logoUrl?: string;
}

export const getPesantrenProfile = (): PesantrenProfile => {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('smartsantri_pesantren_profile');
    if (local) {
      try {
        return JSON.parse(local) as PesantrenProfile;
      } catch (e) {
        // Fallback
      }
    }
  }
  return {
    namaPesantren: '',
    namaYayasan: '',
    nspp: '',
    nomorNotaris: '',
    alamat: '',
    desa: '',
    kecamatan: '',
    kabupaten: '',
    provinsi: '',
    kodePos: '',
    telepon: '',
    email: '',
    website: '',
    namaPengasuh: '',
    namaWakilPengasuh: '',
    namaKetuaYayasan: '',
    namaKetuaPondok: '',
    namaSekretaris: '',
    namaBendahara: '',
    namaKetuaKeamanan: '',
    namaKetuaPendidikan: '',
    kotaTandaTangan: '',
    logoStyle: 'classic',
    kopTambahan1: '',
    kopTambahan2: '',
  };
};

// Address Hierarchical Mock Data
export const PROVINSI_OPTIONS = [
  "Jawa Timur", 
  "Jawa Tengah", 
  "Jawa Barat", 
  "DKI Jakarta", 
  "DI Yogyakarta", 
  "Kalimantan Selatan", 
  "Sumatera Utara"
];

export const KABUPATEN_MAP: Record<string, string[]> = {
  "Jawa Timur": ["Jombang", "Kediri", "Surabaya", "Gresik"],
  "Jawa Tengah": ["Kudus", "Semarang", "Demak"],
  "Jawa Barat": ["Tasikmalaya", "Bandung", "Bogor"],
  "DKI Jakarta": ["Jakarta Pusat", "Jakarta Selatan"],
  "DI Yogyakarta": ["Sleman", "Bantul", "Yogyakarta"],
  "Kalimantan Selatan": ["Martapura", "Banjarmasin"],
  "Sumatera Utara": ["Medan", "Deli Serdang"]
};

export const KECAMATAN_MAP: Record<string, string[]> = {
  "Jombang": ["Tembelang", "Peterongan", "Diwek", "Ploso"],
  "Kediri": ["Pare", "Ngadiluwih"],
  "Surabaya": ["Wonokromo", "Gubeng"],
  "Gresik": ["Manyar", "Kebomas"],
  "Kudus": ["Bae", "Kota", "Jati"],
  "Semarang": ["Banyumanik", "Tembalang"],
  "Demak": ["Sayung", "Mranggen"],
  "Tasikmalaya": ["Cihideung", "Indihiang", "Cipedes"],
  "Bandung": ["Coblong", "Lembang"],
  "Bogor": ["Ciawi", "Cisarua"],
  "Jakarta Pusat": ["Menteng", "Kemayoran"],
  "Jakarta Selatan": ["Kebayoran Baru", "Cilandak"],
  "Sleman": ["Depok", "Ngaglik", "Sardonoharjo"],
  "Bantul": ["Kasihan", "Sewon"],
  "Yogyakarta": ["Kotagede", "Umbulharjo"],
  "Martapura": ["Martapura Kota", "Kertak Hanyar"],
  "Banjarmasin": ["Banjarmasin Tengah", "Banjarmasin Utara"],
  "Medan": ["Medan Area", "Medan Baru"],
  "Deli Serdang": ["Tanjung Morawa", "Lubuk Pakam"]
};

export const DESA_MAP: Record<string, string[]> = {
  "Tembelang": ["Tambakberas", "Pesantren", "Bedahlondo", "Mojokrapak"],
  "Peterongan": ["Mancar", "Kelebengan", "Peterongan"],
  "Diwek": ["Cukir", "Keras"],
  "Ploso": ["Ploso", "Rejoagung"],
  "Pare": ["Tulungrejo", "Pelemahan"],
  "Ngadiluwih": ["Ngadiluwih", "Purwokerto"],
  "Wonokromo": ["Darmo", "Sawunggaling", "Wonokromo"],
  "Gubeng": ["Gubeng", "Airlangga"],
  "Manyar": ["Manyar", "Suci"],
  "Kebomas": ["Kebomas", "Randuagung"],
  "Bae": ["Bae", "Dersalam"],
  "Kota": ["Kauman", "Demaan"],
  "Jati": ["Getas", "Jati Wetan"],
  "Banyumanik": ["Banyumanik", "Pudakpayung"],
  "Tembalang": ["Tembalang", "Sambiroto"],
  "Sayung": ["Sayung", "Sriwulan"],
  "Mranggen": ["Mranggen", "Batursari"],
  "Cihideung": ["Argasari", "Yudanagara"],
  "Indihiang": ["Indihiang", "Sirnagalih"],
  "Cipedes": ["Cipedes", "Panglayungan"],
  "Coblong": ["Dago", "Sadangserang"],
  "Lembang": ["Lembang", "Jayagiri"],
  "Ciawi": ["Ciawi", "Bendungan"],
  "Cisarua": ["Cisarua", "Tugu Utara"],
  "Menteng": ["Menteng", "Cikini"],
  "Kemayoran": ["Kemayoran", "Gunung Sahari"],
  "Kebayoran Baru": ["Selong", "Senayan"],
  "Cilandak": ["Cilandak Barat", "Pondok Labu"],
  "Depok": ["Caturtunggal", "Condongcatur"],
  "Ngaglik": ["Sariharjo", "Sinduharjo"],
  "Sardonoharjo": ["Sardonoharjo", "Sariharjo"],
  "Kasihan": ["Bangunjiwo", "Tirtonirmolo"],
  "Sewon": ["Panggungharjo", "Pendowoharjo"],
  "Kotagede": ["Prenggan", "Purbayan"],
  "Umbulharjo": ["Semaki", "Tahunan"],
  "Martapura Kota": ["Sekumpul", "Martapura"],
  "Kertak Hanyar": ["Manarap", "Kertak Hanyar"],
  "Banjarmasin Tengah": ["Kertak Baru", "Mawar"],
  "Banjarmasin Utara": ["Alalak", "Sungai Miai"],
  "Medan Area": ["Sukaramai", "Matsum"],
  "Medan Baru": ["Padang Bulan", "Taman Sari"],
  "Tanjung Morawa": ["Tanjung Morawa", "Buntu Bedimbar"],
  "Lubuk Pakam": ["Lubuk Pakam", "Sekip"]
};

// Default Avatar URLs for unregistered / new santri
export const PUTRA_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
export const PUTRI_AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150";

export const isCustomPasFoto = (url: string | undefined | null): boolean => {
  if (!url) return false;
  const lowercaseUrl = url.toLowerCase().trim();
  if (lowercaseUrl === "" || lowercaseUrl === "undefined" || lowercaseUrl === "null") return false;
  if (
    lowercaseUrl.includes("images.unsplash.com") || 
    lowercaseUrl.includes("photo-1535713") || 
    lowercaseUrl.includes("photo-1494790")
  ) {
    return false;
  }
  return true;
};

export const renderSantriAvatar = (s: Santri, className: string = "h-10 w-10 text-xs", isRect: boolean = false) => {
  if (isCustomPasFoto(s.filePasFoto)) {
    return (
      <img 
        src={s.filePasFoto} 
        className={`${className} object-cover`}
        alt={s.nama || 'Santri'}
        referrerPolicy="no-referrer"
      />
    );
  }

  const isPutri = s.gender === 'Putri';
  const bgColor = isPutri ? 'bg-pink-500 text-white' : 'bg-[#00b0f0] text-white';
  
  const getInitials = (name: string): string => {
    const words = (name || '').trim().split(/\s+/);
    if (words.length === 0 || !words[0]) return '?';
    if (words.length === 1) {
      return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const roundedClass = isRect ? "rounded-xl" : "rounded-full";

  return (
    <div className={`${className} flex items-center justify-center font-sans font-extrabold select-none ${roundedClass} shrink-0 ${bgColor}`}>
      <span className="text-[11px] leading-none uppercase">{getInitials(s.nama)}</span>
    </div>
  );
};

export const calculateRealtimeAge = (birthDateStr?: string): number | null => {
  if (!birthDateStr) return null;
  let birthDate: Date;
  try {
    if (birthDateStr.includes('-')) {
      const parts = birthDateStr.split('-');
      if (parts[0].length === 4) {
        birthDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else {
      birthDate = new Date(birthDateStr);
    }
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch (e) {
    return null;
  }
};

export function PrintTemplate({ printableSantri, renderSantriAvatar: customRenderSantriAvatar }: { printableSantri: Santri | null, renderSantriAvatar?: (s: Santri, cls: string, isRect?: boolean) => React.ReactNode }) {
  if (!printableSantri) return null;
  const avatarRenderer = customRenderSantriAvatar || renderSantriAvatar;
  const profile = getPesantrenProfile();
  return (
    <div className="hidden print:block font-sans text-slate-900 bg-white p-12 min-h-screen">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
      <div className="print-area space-y-8">
        {/* Kop Surat / Header */}
        <div className="flex items-center justify-between border-b-4 border-emerald-800 pb-4">
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{profile.namaYayasan}</span>
            <h2 className="text-2xl font-extrabold text-emerald-800 uppercase tracking-tight">{profile.namaPesantren}</h2>
            <p className="text-xs text-slate-500 font-semibold font-mono">{profile.alamat}, Ds. {profile.desa}, Kec. {profile.kecamatan}, Kab. {profile.kabupaten}, {profile.provinsi} {profile.kodePos}</p>
            <p className="text-xs text-slate-500 font-semibold font-mono">Telp: {profile.telepon} | Email: {profile.email}</p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded">BIODATA RESMI</span>
          </div>
        </div>

        {/* Main Biodata Sheet */}
        <div className="space-y-6">
          <div className="flex items-start gap-8">
            {/* Circular Frame Photo on Print */}
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-slate-300 shrink-0 shadow-inner">
              {avatarRenderer(printableSantri, "w-full h-full object-cover", false)}
            </div>
            
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl font-bold text-slate-950 uppercase">{printableSantri.nama}</h1>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm border-t border-slate-100 pt-3">
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">NIS (Nomor Induk Santri)</span>
                  <span className="font-semibold text-slate-800 font-mono">{printableSantri.nis || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">Status Keanggotaan</span>
                  <span className="font-semibold text-slate-800">{printableSantri.statusKeanggotaan || 'Aktif'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sections Grid */}
          <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-6">
            
            {/* Data Diri */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider text-xs">I. DATA PRIBADI</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Jenis Kelamin:</span>
                  <span className="font-medium text-slate-800 ml-1">{printableSantri.gender || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Tempat, Tanggal Lahir:</span>
                  <span className="font-medium text-slate-800 ml-1">{printableSantri.tempatLahir || '-'}, {printableSantri.tanggalLahir || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">NIK:</span>
                  <span className="font-medium text-slate-800 ml-1 font-mono">{printableSantri.nik || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">No. KK:</span>
                  <span className="font-medium text-slate-800 ml-1 font-mono">{printableSantri.noKk || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Anak Ke:</span>
                  <span className="font-medium text-slate-800 ml-1">
                    {printableSantri.anakKe && printableSantri.anakKe !== 0 ? printableSantri.anakKe : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Jumlah Saudara:</span>
                  <span className="font-medium text-slate-800 ml-1">
                    {printableSantri.dariBersaudara !== undefined && printableSantri.dariBersaudara !== null ? printableSantri.dariBersaudara : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Orang Tua / Wali */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider text-xs">II. DATA ORANG TUA / WALI</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Nama Ayah:</span>
                  <span className="font-medium text-slate-800 ml-1">{printableSantri.namaAyah || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Pekerjaan Ayah:</span>
                  <span className="font-medium text-slate-800 ml-1">{printableSantri.pekerjaanAyah || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Nama Ibu:</span>
                  <span className="font-medium text-slate-800 ml-1">{printableSantri.namaIbu || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Pekerjaan Ibu:</span>
                  <span className="font-medium text-slate-800 ml-1">{printableSantri.pekerjaanIbu || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">No. HP Wali:</span>
                  <span className="font-medium text-slate-800 ml-1 font-mono">{printableSantri.noHp || '-'}</span>
                </div>
              </div>
            </div>

            {/* Alamat Rumah */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider text-xs">III. ALAMAT DOMISILI</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Alamat Lengkap:</span>
                  <span className="font-medium text-slate-800 ml-1">{printableSantri.alamat || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">RT / RW:</span>
                  <span className="font-medium text-slate-800 ml-1">{printableSantri.rt || '-'} / {printableSantri.rw || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Desa / Kelurahan:</span>
                  <span className="font-medium text-slate-800 ml-1">{printableSantri.desa || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Kecamatan:</span>
                  <span className="font-medium text-slate-800 ml-1">{printableSantri.kecamatan || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Kabupaten, Provinsi:</span>
                  <span className="font-medium text-slate-800 ml-1">{printableSantri.kabupaten || '-'}, {printableSantri.provinsi || '-'}</span>
                </div>
              </div>
            </div>

            {/* Administrasi & Akademik */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider text-xs">IV. ADMINISTRASI & AKADEMIK</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">NISN:</span>
                  <span className="font-medium text-slate-800 ml-1 font-mono">{printableSantri.nisn || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">NISM:</span>
                  <span className="font-medium text-slate-800 ml-1 font-mono">{printableSantri.nism || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Domisili Pesantren:</span>
                  <span className="font-medium text-slate-800 ml-1">{printableSantri.statusDomisili || 'Muqim'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Tanggal Masuk:</span>
                  <span className="font-medium text-slate-800 ml-1 font-mono">{printableSantri.tanggalMasuk || '-'}</span>
                </div>
                {printableSantri.tanggalKeluar && (
                  <div>
                    <span className="text-slate-400 font-semibold">Tanggal Keluar / Alumni:</span>
                    <span className="font-medium text-slate-800 ml-1 font-mono">{printableSantri.tanggalKeluar}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Catatan / Memo */}
          <div className="border-t border-slate-200 pt-6 space-y-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">V. CATATAN / REKAM MEDIS & KEPENGURUSAN</h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-150">
              {printableSantri.catatan || 'Tidak ada catatan kepengurusan khusus untuk santri ini.'}
            </p>
          </div>

          {/* Tanda Tangan */}
          <div className="pt-12 grid grid-cols-2 text-center text-xs">
            <div>
              <p className="text-slate-500 mb-16">Wali Santri,</p>
              <p className="font-bold border-b border-slate-400 inline-block px-8 pb-1">(..........................................)</p>
            </div>
            <div>
              <p className="text-slate-500 mb-16">{profile.kotaTandaTangan}, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}<br />Sekretaris Pesantren,</p>
              <p className="font-bold border-b border-slate-400 inline-block px-8 pb-1">{profile.namaSekretaris}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export function BulkPrintTemplate({ printableSantriList, renderSantriAvatar: customRenderSantriAvatar }: { printableSantriList: Santri[] | null, renderSantriAvatar?: (s: Santri, cls: string, isRect?: boolean) => React.ReactNode }) {
  if (!printableSantriList || printableSantriList.length === 0) return null;
  const avatarRenderer = customRenderSantriAvatar || renderSantriAvatar;
  const profile = getPesantrenProfile();
  return (
    <div className="hidden print:block font-sans text-slate-900 bg-white min-h-screen">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area-bulk, .print-area-bulk * {
            visibility: visible;
          }
          .print-area-bulk {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>
      <div className="print-area-bulk">
        {printableSantriList.map((s, index) => (
          <div key={s.id} className={`p-12 ${index < printableSantriList.length - 1 ? 'page-break' : ''} space-y-8`}>
            {/* Kop Surat / Header */}
            <div className="flex items-center justify-between border-b-4 border-emerald-800 pb-4">
              <div className="text-left">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{profile.namaYayasan}</span>
                <h1 className="font-display text-2xl font-extrabold text-slate-900 leading-tight">{profile.namaPesantren.toUpperCase()}</h1>
                <p className="text-xs text-slate-500 font-medium">{profile.alamat}, Ds. {profile.desa}, Kec. {profile.kecamatan}, Kab. {profile.kabupaten}, {profile.provinsi} {profile.kodePos}</p>
                <p className="text-[10px] text-slate-400">Telp: {profile.telepon} | Email: {profile.email} | Web: {profile.website}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 font-extrabold text-sm border border-emerald-100">
                  {profile.namaPesantren.split(' ').slice(-1)[0]?.substring(0, 2).toUpperCase() || 'PP'}
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h2 className="font-display text-lg font-bold text-slate-900 uppercase tracking-wide">BIODATA LENGKAP SANTRI</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">NIS: {s.nis || 'Belum Terbit'}</p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-3 gap-8">
              {/* Photo Section */}
              <div className="col-span-1 flex flex-col items-center space-y-3">
                <div className="w-40 h-52 border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center shadow-xs">
                  {avatarRenderer(s, "w-full h-full object-cover", false)}
                </div>
                <div className="text-center">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                    s.statusDomisili === 'Muqim' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    {s.statusDomisili || 'Muqim'}
                  </span>
                </div>
              </div>

              {/* Fields Section */}
              <div className="col-span-2 space-y-6">
                <div>
                  <h3 className="font-display text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">
                    Data Pribadi
                  </h3>
                  <table className="w-full text-xs text-left text-slate-700">
                    <tbody>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-400 w-32">Nama Lengkap</td>
                        <td className="py-2 font-bold text-slate-900">: {s.nama}</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-400">NIS / NISN</td>
                        <td className="py-2 font-mono">: {s.nis || '-'} / {s.nisn || '-'}</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-400">NIK / No. KK</td>
                        <td className="py-2 font-mono">: {s.nik || '-'} / {s.noKk || '-'}</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-400">Tempat, Tgl Lahir</td>
                        <td className="py-2">: {s.tempatLahir || '-'}{s.tanggalLahir ? `, ${s.tanggalLahir}` : ''}</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-400">Gender</td>
                        <td className="py-2">: {s.gender || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="font-display text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">
                    Data Keluarga & Alamat
                  </h3>
                  <table className="w-full text-xs text-left text-slate-700">
                    <tbody>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-400 w-32">Nama Orang Tua</td>
                        <td className="py-2">: Ayah: {s.namaAyah || '-'} | Ibu: {s.namaIbu || '-'}</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-400">Alamat Lengkap</td>
                        <td className="py-2">: {s.alamat || '-'}{s.rt || s.rw ? `, RT ${s.rt || '-'}/RW ${s.rw || '-'}` : ''}{s.desa ? `, Ds. ${s.desa}` : ''}{s.kecamatan ? `, Kec. ${s.kecamatan}` : ''}{s.kabupaten ? `, Kab. ${s.kabupaten}` : ''}{s.provinsi ? `, Prov. ${s.provinsi}` : ''}</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-400">No. HP Wali</td>
                        <td className="py-2 font-mono">: {s.noHp || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="font-display text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">
                    Akademik & Administrasi
                  </h3>
                  <table className="w-full text-xs text-left text-slate-700">
                    <tbody>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-400 w-32">Tanggal Masuk</td>
                        <td className="py-2 font-mono">: {s.tanggalMasuk || '-'}</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-400">Status Keanggotaan</td>
                        <td className="py-2 font-bold">: {s.statusKeanggotaan || 'Aktif'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer / Signature */}
            <div className="pt-12 flex justify-between text-xs">
              <div className="text-left">
                <p>Mengetahui,</p>
                <p className="font-bold mt-16 text-slate-900">{profile.namaPengasuh}</p>
                <p className="text-[10px] text-slate-400">Pengasuh Utama</p>
              </div>
              <div className="text-right">
                <p>{profile.kotaTandaTangan}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold mt-16 text-slate-900">{profile.namaSekretaris}</p>
                <p className="text-[10px] text-slate-400">Sekretaris Umum</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PrintSuratTemplate({ printableSuratList }: { printableSuratList: Surat[] | null }) {
  if (!printableSuratList || printableSuratList.length === 0) return null;
  const profile = getPesantrenProfile();
  return (
    <div className="hidden print:block font-sans text-slate-900 bg-white p-12 min-h-screen">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area-surat, .print-area-surat * {
            visibility: visible;
          }
          .print-area-surat {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
      <div className="print-area-surat space-y-8">
        {/* Kop Surat / Header */}
        <div className="flex items-center justify-between border-b-4 border-emerald-800 pb-4">
          <div className="text-left">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{profile.namaYayasan}</span>
            <h1 className="font-display text-2xl font-extrabold text-slate-900 leading-tight">{profile.namaPesantren.toUpperCase()}</h1>
            <p className="text-xs text-slate-500 font-medium">{profile.alamat}, Ds. {profile.desa}, Kec. {profile.kecamatan}, Kab. {profile.kabupaten}, {profile.provinsi} {profile.kodePos}</p>
            <p className="text-[10px] text-slate-400">Telp: {profile.telepon} | Email: {profile.email} | Web: {profile.website}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 font-extrabold text-sm border border-emerald-100">
              {profile.namaPesantren.split(' ').slice(-1)[0]?.substring(0, 2).toUpperCase() || 'PP'}
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="font-display text-lg font-bold text-slate-900 uppercase tracking-wide">LAPORAN ARSIP PERSURATAN</h2>
          <p className="text-xs text-slate-500 mt-0.5">Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Table */}
        <table className="w-full text-xs text-left border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-50 text-slate-800 font-bold">
              <th className="border border-slate-300 p-3 w-1/12 text-center">No</th>
              <th className="border border-slate-300 p-3 w-3/12">Nomor Surat</th>
              <th className="border border-slate-300 p-3 w-4/12">Perihal</th>
              <th className="border border-slate-300 p-3 w-1/12 text-center">Jenis</th>
              <th className="border border-slate-300 p-3 w-2/12">Mitra / Instansi</th>
              <th className="border border-slate-300 p-3 w-1/12 text-center">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {printableSuratList.map((sr, index) => (
              <tr key={sr.id} className="text-slate-700">
                <td className="border border-slate-300 p-2.5 text-center">{index + 1}</td>
                <td className="border border-slate-300 p-2.5 font-mono">{sr.noSurat}</td>
                <td className="border border-slate-300 p-2.5 font-bold">{sr.perihal}</td>
                <td className="border border-slate-300 p-2.5 text-center">
                  <span className={sr.jenis === 'Masuk' ? 'text-blue-700 font-bold' : 'text-violet-700 font-bold'}>
                    {sr.jenis}
                  </span>
                </td>
                <td className="border border-slate-300 p-2.5">{sr.mitra}</td>
                <td className="border border-slate-300 p-2.5 text-center font-mono">{sr.tanggal}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Signature */}
        <div className="pt-8 flex justify-between text-xs">
          <div className="text-left opacity-0">
            <p>Mengetahui,</p>
            <p className="font-bold mt-16 text-slate-900">{profile.namaPengasuh}</p>
          </div>
          <div className="text-right">
            <p>{profile.kotaTandaTangan}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold mt-16 text-slate-900">{profile.namaSekretaris}</p>
            <p className="text-[10px] text-slate-400">Sekretaris Umum</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getFormalKelasDisplay = (s: Santri): string => {
  return '-';
};

