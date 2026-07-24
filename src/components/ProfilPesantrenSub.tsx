import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Award, Upload, Trash2, Info, User } from 'lucide-react';
import { PesantrenProfile } from './PengaturanView';
import { compressImage } from '../lib/utils';

interface ProfilPesantrenSubProps {
  profile: PesantrenProfile;
  handleProfileChange: (key: keyof PesantrenProfile, value: string) => void;
  handleSave: () => Promise<void>;
  hasChanges: boolean;
}

export default function ProfilPesantrenSub({
  profile,
  handleProfileChange,
  handleSave,
  hasChanges,
}: ProfilPesantrenSubProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-6 font-sans text-slate-800 max-w-5xl mx-auto"
    >
      {/* Main Form Fields Container - Full Width Stack */}
      <div className="space-y-6 text-left">
        
        {/* Section 1: Identitas Yayasan & Pesantren */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#A30022] font-semibold text-sm">
            <div className="flex items-center justify-center h-4.5 w-4.5 rounded-full border border-[#A30022] text-[#A30022] font-extrabold text-xs">
              i
            </div>
            <span>Identitas Yayasan & Pesantren</span>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Pesantren</label>
              <input 
                type="text" 
                value={profile.namaPesantren} 
                onChange={(e) => handleProfileChange('namaPesantren', e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                placeholder="Masukkan nama pesantren"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Yayasan / Badan Hukum</label>
              <input 
                type="text" 
                value={profile.namaYayasan} 
                onChange={(e) => handleProfileChange('namaYayasan', e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                placeholder="Masukkan nama yayasan atau badan hukum"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nomor Statistik (NSPP)</label>
                <input 
                  type="text" 
                  value={profile.nspp} 
                  onChange={(e) => handleProfileChange('nspp', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Masukkan NSPP"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nomor Notaris</label>
                <input 
                  type="text" 
                  value={profile.nomorNotaris} 
                  onChange={(e) => handleProfileChange('nomorNotaris', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Masukkan Nomor Notaris"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Alamat & Kontak Resmi */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#A30022] font-semibold text-sm">
            <MapPin className="h-4.5 w-4.5 text-[#A30022]" />
            <span>Alamat & Kontak Resmi</span>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Jalan</label>
              <input 
                type="text" 
                value={profile.alamat} 
                onChange={(e) => handleProfileChange('alamat', e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                placeholder="Masukkan alamat jalan pesantren"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Desa / Kelurahan</label>
                <input 
                  type="text" 
                  value={profile.desa} 
                  onChange={(e) => handleProfileChange('desa', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Desa / Kelurahan"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kecamatan</label>
                <input 
                  type="text" 
                  value={profile.kecamatan} 
                  onChange={(e) => handleProfileChange('kecamatan', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Kecamatan"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kabupaten / Kota</label>
                <input 
                  type="text" 
                  value={profile.kabupaten} 
                  onChange={(e) => handleProfileChange('kabupaten', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Kabupaten / Kota"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Provinsi</label>
                <input 
                  type="text" 
                  value={profile.provinsi} 
                  onChange={(e) => handleProfileChange('provinsi', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Provinsi"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kode Pos</label>
                <input 
                  type="text" 
                  value={profile.kodePos} 
                  onChange={(e) => handleProfileChange('kodePos', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Kode Pos"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Resmi</label>
                <input 
                  type="email" 
                  value={profile.email} 
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="info@darussalam.org"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Situs Website</label>
                <input 
                  type="text" 
                  value={profile.website} 
                  onChange={(e) => handleProfileChange('website', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="www.darussalam.org"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Telepon / WA</label>
                <input 
                  type="text" 
                  value={profile.telepon} 
                  onChange={(e) => handleProfileChange('telepon', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="081234567890"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Pimpinan & Penandatangan Resmi */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#A30022] font-semibold text-sm">
            <User className="h-4.5 w-4.5 text-[#A30022]" />
            <span>Pimpinan & Penandatangan Resmi</span>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pengasuh / Pimpinan Tertinggi</label>
                <input 
                  type="text" 
                  value={profile.namaPengasuh} 
                  onChange={(e) => handleProfileChange('namaPengasuh', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="KH. Muhammad Shodiq, M.Ag."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wakil Pengasuh</label>
                <input 
                  type="text" 
                  value={profile.namaWakilPengasuh} 
                  onChange={(e) => handleProfileChange('namaWakilPengasuh', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Masukkan nama wakil pengasuh"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ketua Yayasan</label>
                <input 
                  type="text" 
                  value={profile.namaKetuaYayasan} 
                  onChange={(e) => handleProfileChange('namaKetuaYayasan', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Masukkan nama ketua yayasan"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ketua Pondok</label>
                <input 
                  type="text" 
                  value={profile.namaKetuaPondok} 
                  onChange={(e) => handleProfileChange('namaKetuaPondok', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Masukkan nama ketua pondok"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sekretaris</label>
                <input 
                  type="text" 
                  value={profile.namaSekretaris} 
                  onChange={(e) => handleProfileChange('namaSekretaris', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Masukkan nama sekretaris"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bendahara</label>
                <input 
                  type="text" 
                  value={profile.namaBendahara} 
                  onChange={(e) => handleProfileChange('namaBendahara', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Masukkan nama bendahara"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ketua Keamanan</label>
                <input 
                  type="text" 
                  value={profile.namaKetuaKeamanan} 
                  onChange={(e) => handleProfileChange('namaKetuaKeamanan', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Masukkan nama ketua keamanan"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ketua Pendidikan</label>
                <input 
                  type="text" 
                  value={profile.namaKetuaPendidikan} 
                  onChange={(e) => handleProfileChange('namaKetuaPendidikan', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Masukkan nama ketua pendidikan"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kota Penandatangan Dokumen</label>
              <input 
                type="text" 
                value={profile.kotaTandaTangan} 
                onChange={(e) => handleProfileChange('kotaTandaTangan', e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                placeholder="Kota Penandatangan"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Kustomisasi Logo Institusi */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#A30022] font-semibold text-sm">
            <Award className="h-4.5 w-4.5 text-[#A30022]" />
            <span>Kustomisasi Logo Institusi</span>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-800">Logo Kustom Pesantren</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Opsional. Unggah logo institusi Anda sendiri.</p>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                {profile.logoUrl && (
                  <div className="h-10 w-10 overflow-hidden border border-slate-200 rounded-lg p-1 bg-white flex items-center justify-center">
                    <img src={profile.logoUrl} alt="Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
                
                <label className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 text-[10px] font-bold uppercase cursor-pointer transition-all active:scale-95 shadow-sm">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{profile.logoUrl ? "GANTI LOGO" : "UNGGAH LOGO"}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          alert("Ukuran file terlalu besar! Maksimum ukuran logo adalah 10MB.");
                          return;
                        }
                        try {
                          // Compress image to max 800px width/height
                          const base64 = await compressImage(file, 800, 800, 0.75);
                          handleProfileChange('logoUrl', base64);
                        } catch (err: any) {
                          console.error("Gagal mengompresi logo:", err);
                          alert("Gagal memproses gambar logo.");
                        }
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
                
                {profile.logoUrl && (
                  <button
                    type="button"
                    onClick={() => handleProfileChange('logoUrl', '')}
                    className="inline-flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 h-10 w-10 border border-rose-200 cursor-pointer transition-all active:scale-95"
                    title="Hapus Logo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Unified Save Action Block */}
      <div className="flex justify-end mt-8">
        <button 
          onClick={handleSave}
          disabled={!hasChanges}
          className={`font-sans font-semibold text-xs px-10 py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-red-900/10 active:scale-95 flex items-center justify-center gap-2 ${
            hasChanges
              ? 'bg-[#A30022] hover:bg-[#8B0018] text-white cursor-pointer'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
          }`}
        >
          Simpan Perubahan
        </button>
      </div>

    </motion.div>
  );
}
