import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronLeft, ChevronRight, Upload, Trash2, UserPlus, 
  FileText, User, GraduationCap, CheckCircle2, Eye, AlertTriangle, AlertCircle, Sparkles
} from 'lucide-react';
import { Santri, Lembaga, Kelas, isDefaultClass } from '../../types';
import { 
  PROVINSI_OPTIONS, KABUPATEN_MAP, KECAMATAN_MAP, DESA_MAP, 
  PUTRA_AVATAR, PUTRI_AVATAR 
} from '../SekretarisHelper';
import { BirthDatePicker } from './BirthDatePicker';
import { SearchableSelect } from './SearchableSelect';
import { uploadFileToStorage, fetchTableData } from '../../lib/api';
import { formatBigDigit } from '../../lib/utils';

const TEMPAT_LAHIR_OPTIONS = [
  "Aceh Barat", "Aceh Barat Daya", "Aceh Besar", "Aceh Jaya", "Aceh Selatan", "Aceh Singkil", "Aceh Tamiang", "Aceh Tengah", "Aceh Tenggara", "Aceh Timur", "Aceh Utara", "Agam", "Alor", "Asahan", "Asmat", "Badung", "Balangan", "Bandung", "Bandung Barat", "Banggai", "Banggai Kepulauan", "Banggai Laut", "Bangka", "Bangka Barat", "Bangka Selatan", "Bangka Tengah", "Bangkalan", "Bangli", "Banjar", "Banjarnegara", "Bantaeng", "Bantul", "Banyuasin", "Banyumas", "Banyuwangi", "Barito Kuala", "Barito Selatan", "Barito Timur", "Barito Utara", "Barru", "Batang", "Batanghari", "Batu Bara", "Bekasi", "Belitung", "Belitung Timur", "Belu", "Bener Meriah", "Bengkalis", "Bengkayang", "Bengkulu Selatan", "Bengkulu Tengah", "Bengkulu Utara", "Berau", "Biak Numfor", "Bima", "Bintan", "Bireuen", "Blitar", "Blora", "Boalemo", "Bogor", "Bojonegoro", "Bolaang Mongondow", "Bolaang Mongondow Selatan", "Bolaang Mongondow Timur", "Bolaang Mongondow Utara", "Bombana", "Bondowoso", "Bone", "Bone Bolango", "Boven Digoel", "Boyolali", "Brebes", "Buleleng", "Bulukumba", "Bulungan", "Bungo", "Buol", "Buru", "Buru Selatan", "Buton", "Buton Selatan", "Buton Tengah", "Buton Utara", "Ciamis", "Cianjur", "Cilacap", "Cirebon", "Dairi", "Deiyai", "Deli Serdang", "Demak", "Dharmasraya", "Dogiyai", "Dompu", "Donggala", "Empat Lawang", "Ende", "Enrekang", "Fakfak", "Flores Timur", "Garut", "Gayo Lues", "Gianyar", "Gorontalo", "Gorontalo Utara", "Gowa", "Gresik", "Grobogan", "Gunung Mas", "Gunungkidul", "Halmahera Barat", "Halmahera Selatan", "Halmahera Tengah", "Halmahera Timur", "Halmahera Utara", "Hulu Sungai Selatan", "Hulu Sungai Tengah", "Hulu Sungai Utara", "Humbang Hasundutan", "Indragiri Hilir", "Indragiri Hulu", "Indramayu", "Intan Jaya", "Jayapura", "Jayawijaya", "Jember", "Jembrana", "Jeneponto", "Jepara", "Jombang", "Kaimana", "Kampar", "Kapuas", "Kapuas Hulu", "Karanganyar", "Karangasem", "Karawang", "Karimun", "Karo", "Katingan", "Kaur", "Kayong Utara", "Kebumen", "Kediri", "Keerom", "Kendal", "Kepahiang", "Kepulauan Anambas", "Kepulauan Aru", "Kepulauan Mentawai", "Kepulauan Meranti", "Kepulauan Sangihe", "Kepulauan Selayar", "Kepulauan Seribu", "Kepulauan Siau Tagulandang Biaro", "Kepulauan Sula", "Kepulauan Talaud", "Kepulauan Tanimbar", "Kepulauan Yapen", "Kerinci", "Ketapang", "Klaten", "Klungkung", "Kolaka", "Kolaka Timur", "Kolaka Utara", "Konawe", "Konawe Kepulauan", "Konawe Selatan", "Konawe Utara", "Kotabaru", "Kotawaringin Barat", "Kotawaringin Timur", "Kuantan Singingi", "Kubu Raya", "Kudus", "Kulon Progo", "Kuningan", "Kupang", "Kutai Barat", "Kutai Kartanegara", "Kutai Timur", "Labuhanbatu", "Labuhanbatu Selatan", "Labuhanbatu Utara", "Lahat", "Lamandau", "Lamongan", "Lampung Barat", "Lampung Selatan", "Lampung Tengah", "Lampung Timur", "Lampung Utara", "Landak", "Langkat", "Lanny Jaya", "Lebak", "Lebong", "Lembata", "Lima Puluh Kota", "Lingga", "Lombok Barat", "Lombok Tengah", "Lombok Timur", "Lombok Utara", "Lumajang", "Luwu", "Luwu Timur", "Luwu Utara", "Madiun", "Magelang", "Magetan", "Mahakam Ulu", "Majalengka", "Majene", "Malaka", "Malang", "Malinau", "Maluku Barat Daya", "Maluku Tengah", "Maluku Tenggara", "Mamasa", "Mamberamo Raya", "Mamberamo Tengah", "Mamuju", "Mamuju Tengah", "Mamuju Utara", "Mandailing Natal", "Manggarai", "Manggarai Barat", "Manggarai Timur", "Manokwari", "Manokwari Selatan", "Mappi", "Maros", "Maybrat", "Melawi", "Mempawah", "Merangin", "Merauke", "Mesuji", "Mimika", "Minahasa", "Minahasa Selatan", "Minahasa Tenggara", "Minahasa Utara", "Mojokerto", "Morowali", "Morowali Utara", "Muara Enim", "Muaro Jambi", "Mukomuko", "Muna", "Muna Barat", "Murung Raya", "Musi Banyuasin", "Musi Rawas", "Musi Rawas Utara", "Nabire", "Nagan Raya", "Nagekeo", "Natuna", "Nduga", "Ngada", "Nganjuk", "Ngawi", "Nias", "Nias Barat", "Nias Selatan", "Nias Utara", "Nunukan", "Ogan Ilir", "Ogan Komering Ilir", "Ogan Komering Ulu", "Ogan Komering Ulu Selatan", "Ogan Komering Ulu Timur", "Pacitan", "Padang Lawas", "Padang Lawas Utara", "Padang Pariaman", "Pakpak Bharat", "Pamekasan", "Pandeglang", "Pangandaran", "Pangkajene dan Kepulauan", "Paniai", "Parigi Moutong", "Pasaman", "Pasaman Barat", "Paser", "Pasuruan", "Pati", "Pegunungan Arfak", "Pegunungan Bintang", "Pekalongan", "Pelalawan", "Pemalang", "Penajam Paser Utara", "Penukal Abab Lematang Ilir", "Pesawaran", "Pesisir Barat", "Pesisir Selatan", "Pidie", "Pidie Jaya", "Pinrang", "Pohuwato", "Polewali Mandar", "Ponorogo", "Poso", "Pringsewu", "Probolinggo", "Pulang Pisau", "Pulau Morotai", "Pulau Taliabu", "Puncak", "Puncak Jaya", "Purbalingga", "Purwakarta", "Purworejo", "Raja Ampat", "Rejang Lebong", "Rembang", "Rokan Hilir", "Rokan Hulu", "Rote Ndao", "Sabu Raijua", "Sambas", "Samosir", "Sampang", "Sanggau", "Sarmi", "Sarolangun", "Sekadau", "Seluma", "Semarang", "Seram Bagian Barat", "Seram Bagian Timur", "Serang", "Serdang Bedagai", "Seruyan", "Siak", "Sidenreng Rappang", "Sidoarjo", "Sigi", "Sijunjung", "Sikka", "Simalungun", "Simeulue", "Sinjai", "Sintang", "Situbondo", "Sleman", "Solok", "Solok Selatan", "Soppeng", "Sorong", "Sorong Selatan", "Sragen", "Subang", "Sukabumi", "Sukamara", "Sukoharjo", "Sumba Barat", "Sumba Barat Daya", "Sumba Tengah", "Sumba Timur", "Sumbawa", "Sumbawa Barat", "Sumedang", "Sumenep", "Tabalong", "Tabanan", "Takalar", "Tambrauw", "Tana Tidung", "Tana Toraja", "Tanah Bumbu", "Tanah Datar", "Tanah Laut", "Tangerang", "Tanggamus", "Tanjung Jabung Barat", "Tanjung Jabung Timur", "Tapanuli Selatan", "Tapanuli Tengah", "Tapanuli Utara", "Tapin", "Tasikmalaya", "Tebo", "Tegal", "Teluk Bintuni", "Teluk Wondama", "Temanggung", "Timor Tengah Selatan", "Timor Tengah Utara", "Toba", "Tojo Una-Una", "Tolikara", "Tolitoli", "Toraja Utara", "Trenggalek", "Tuban", "Tulang Bawang", "Tulang Bawang Barat", "Tulungagung", "Wajo", "Wakatobi", "Waropen", "Way Kanan", "Wonogiri", "Wonosobo", "Yahukimo", "Yalimo", "Ambon", "Balikpapan", "Banda Aceh", "Bandar Lampung", "Bandung", "Banjarbaru", "Banjarmasin", "Batam", "Batu", "Bau-Bau", "Bekasi", "Bengkulu", "Bima", "Binjai", "Bitung", "Blitar", "Bogor", "Bontang", "Bukittinggi", "Cilegon", "Cimahi", "Cirebon", "Denpasar", "Depok", "Dumai", "Gorontalo", "Gunungsitoli", "Jakarta Barat", "Jakarta Pusat", "Jakarta Selatan", "Jakarta Timur", "Jakarta Utara", "Jambi", "Jayapura", "Kediri", "Kendari", "Kotamobagu", "Kupang", "Langsa", "Lhokseumawe", "Lubuklinggau", "Madiun", "Magelang", "Makassar", "Malang", "Manado", "Mataram", "Medan", "Metro", "Mojokerto", "Padang", "Padang Panjang", "Padangsidimpuan", "Pagar Alam", "Palangka Raya", "Palembang", "Palopo", "Palu", "Pangkalpinang", "Parepare", "Pariaman", "Pasuruan", "Payakumbuh", "Pekalongan", "Pekanbaru", "Pematangsiantar", "Pontianak", "Prabumulih", "Probolinggo", "Sabang", "Salatiga", "Samarinda", "Sawahlunto", "Semarang", "Serang", "Sibolga", "Singkawang", "Solok", "Sorong", "Subulussalam", "Sukabumi", "Sungai Penuh", "Surabaya", "Surakarta", "Tangerang", "Tangerang Selatan", "Tanjungbalai", "Tanjungpinang", "Tarakan", "Tasikmalaya", "Tebing Tinggi", "Tegal", "Ternate", "Tidore Kepulauan", "Tomohon", "Tual", "Yogyakarta"
];

const UNIQUE_TEMPAT_LAHIR_OPTIONS = Array.from(new Set(TEMPAT_LAHIR_OPTIONS)).sort();
const TEMPAT_LAHIR_OPTIONS_LIST = UNIQUE_TEMPAT_LAHIR_OPTIONS.map(name => ({ id: name, name }));

const getLemId = (k: any) => k ? String(k.lembagaId || k.lembaga_id || '') : '';

const PENDIDIKAN_ALL_OPTIONS = [
  { id: "Tidak Sekolah", name: "Tidak Sekolah" },
  { id: "SD/MI", name: "SD/MI" },
  { id: "SMP/MTs", name: "SMP/MTs" },
  { id: "SMA/MA/MAK", name: "SMA/MA/MAK" },
  { id: "D1", name: "D1" },
  { id: "D2", name: "D2" },
  { id: "D3", name: "D3" },
  { id: "D4", name: "D4" },
  { id: "S1", name: "S1" },
  { id: "S2", name: "S2" },
  { id: "S3", name: "S3" },
  { id: "Lainnya", name: "Lainnya" }
];

const PENDIDIKAN_ANAK_OPTIONS = PENDIDIKAN_ALL_OPTIONS;
const PENDIDIKAN_ORTU_OPTIONS = PENDIDIKAN_ALL_OPTIONS;

const PEKERJAAN_OPTIONS = [
  { id: "Belum/Tidak Bekerja", name: "Belum/Tidak Bekerja" },
  { id: "Mengurus Rumah Tangga", name: "Mengurus Rumah Tangga" },
  { id: "Pelajar/Mahasiswa", name: "Pelajar/Mahasiswa" },
  { id: "Pensiunan", name: "Pensiunan" },
  { id: "Pegawai Negeri Sipil", name: "Pegawai Negeri Sipil" },
  { id: "Tentara Nasional Indonesia", name: "Tentara Nasional Indonesia" },
  { id: "Kepolisian RI", name: "Kepolisian RI" },
  { id: "Perdagangan", name: "Perdagangan" },
  { id: "Petani/Pekebun", name: "Petani/Pekebun" },
  { id: "Peternak", name: "Peternak" },
  { id: "Nelayan/Perikanan", name: "Nelayan/Perikanan" },
  { id: "Industri", name: "Industri" },
  { id: "Konstruksi", name: "Konstruksi" },
  { id: "Wiraswasta", name: "Wiraswasta" },
  { id: "Karyawan Swasta", name: "Karyawan Swasta" },
  { id: "Karyawan BUMN", name: "Karyawan BUMN" },
  { id: "Karyawan BUMD", name: "Karyawan BUMD" },
  { id: "Karyawan Honorer", name: "Karyawan Honorer" },
  { id: "Buruh Harian Lepas", name: "Buruh Harian Lepas" },
  { id: "Buruh Tani/Perkebunan", name: "Buruh Tani/Perkebunan" },
  { id: "Buruh Nelayan/Perikanan", name: "Buruh Nelayan/Perikanan" },
  { id: "Guru", name: "Guru" },
  { id: "Dosen", name: "Dosen" },
  { id: "Dokter", name: "Dokter" },
  { id: "Bidan", name: "Bidan" },
  { id: "Perawat", name: "Perawat" },
  { id: "Sopir", name: "Sopir" },
  { id: "Pedagang", name: "Pedagang" }
];

const compressImageAndGetBase64 = (file: File, maxWidth = 320, maxHeight = 400, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Pas Foto standard aspect ratio 3:4 or auto keeping ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

interface SantriFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSantri: Santri | null;
  onAddSantri: (newSantri: Santri) => void;
  onUpdateSantri?: (updatedSantri: Santri) => void;
  setIsRealImportModalOpen: (val: boolean) => void;
  activeGenderFilter?: string;
  santriList?: Santri[];
  canWritePutra?: boolean;
  canWritePutri?: boolean;
}

const initialFormState = {
  // Identitas
  nama: '',
  nis: '',
  nisn: '',
  nism: '',
  nik: '',
  noKk: '',
  tempatLahir: '',
  tanggalLahir: '',
  gender: '' as 'Putra' | 'Putri' | '',
  anakKe: '0',
  dariBersaudara: '0',

  // Orang Tua
  namaAyah: '',
  nikAyah: '',
  pekerjaanAyah: '',
  pendidikanAyah: '',
  namaIbu: '',
  nikIbu: '',
  pekerjaanIbu: '',
  pendidikanIbu: '',

  // Alamat
  alamat: '',
  rt: '',
  rw: '',
  desa: '',
  kecamatan: '',
  kabupaten: '',
  provinsi: '',
  jarakRumah: '0',
  noHp: '',

  // Status & Administrasi
  statusKeanggotaan: 'Aktif' as 'Aktif' | 'Alumni' | 'Meninggal',
  statusDomisili: 'Muqim' as 'Muqim' | 'Kampung',
  statusEmis: 'Belum' as 'Terdaftar' | 'Belum',
  statusVerval: 'Proses' as 'Sukses' | 'Proses',
  kelas: '',
  kamar: '',
  tanggalMasuk: '',
  tanggalKeluar: '',
  catatan: '',
  pendidikanTerakhir: '',

  // Dokumen (simulated uploaded filenames)
  fileKk: '',
  fileKtp: '',
  fileAkta: '',
  fileIjazah: '',
  filePasFoto: '',
  pendidikanInternal: '',
  pendidikanFormalLembagaId: '',
  pendidikanFormalClassId: 'calon'
};

export default function SantriFormModal({
  isOpen,
  onClose,
  editingSantri,
  onAddSantri,
  onUpdateSantri,
  setIsRealImportModalOpen,
  activeGenderFilter = 'semua',
  santriList = [],
  canWritePutra = true,
  canWritePutri = true,
}: SantriFormModalProps) {
  const [form, setForm] = useState(initialFormState);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string } | null>(null);
  const [isCompressing, setIsCompressing] = useState<Record<string, boolean>>({});
  const [lastGeneratedNis, setLastGeneratedNis] = useState('');
  const [nisAdjustedNotification, setNisAdjustedNotification] = useState<string | null>(null);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const [lembagasList, setLembagasList] = useState<Lembaga[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  useEffect(() => {
    if (isOpen) {
      const local = localStorage.getItem('smartsantri_lembagas');
      if (local) {
        try {
          setLembagasList(JSON.parse(local));
        } catch (e) {
          console.error(e);
        }
      }
      const localK = localStorage.getItem('smartsantri_kelas');
      if (localK) {
        try {
          setKelasList(JSON.parse(localK));
        } catch (e) {
          console.error(e);
        }
      }

      // Fetch fresh data from database to be 100% correct
      fetchTableData<Lembaga>('lembaga', 'smartsantri_lembagas', [])
        .then(data => {
          if (data && data.length > 0) {
            setLembagasList(data);
          }
        })
        .catch(console.error);

      fetchTableData<Kelas>('kelas', 'smartsantri_kelas', [])
        .then(data => {
          if (data && data.length > 0) {
            setKelasList(data);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const getLembagaJenis = (l: Lembaga): 'Formal' | 'Internal' => {
    if (l.jenis && (l.jenis === 'Formal' || l.jenis === 'Internal')) return l.jenis;
    const lower = l.nama.toLowerCase();
    if (
      lower.includes('madin') || 
      lower.includes('diniyah') || 
      lower.includes('tpq') || 
      lower.includes('tahfidz') || 
      lower.includes('pondok') || 
      lower.includes('kitab') || 
      lower.includes('internal') ||
      l.kode.toLowerCase().includes('madin') ||
      l.kode.toLowerCase().includes('tahf')
    ) {
      return 'Internal';
    }
    return 'Formal';
  };

  const extractFormalData = (santri: Santri | null | undefined, lembagas: Lembaga[], kelas: Kelas[]) => {
    if (!santri) return { formalLembagaId: '', formalClassId: 'calon' };
    const formalLembagas = lembagas.filter(l => getLembagaJenis(l) === 'Formal');

    if (santri.pendidikanFormal) {
      const parts = santri.pendidikanFormal.split(' - ');
      const lemName = parts[0]?.trim();
      const clsName = parts[1]?.trim();

      if (lemName) {
        const matchLem = formalLembagas.find(l => 
          l.nama.toLowerCase() === lemName.toLowerCase() ||
          (l.kode && l.kode.toLowerCase() === lemName.toLowerCase())
        );
        if (matchLem) {
          let matchClassId = 'calon';
          if (clsName && clsName.toLowerCase() !== 'calon peserta didik' && clsName.toLowerCase() !== 'calon pelajar') {
            const matchCls = kelas.find(k => 
              getLemId(k) === String(matchLem.id) &&
              k.nama.trim().toLowerCase() === clsName.toLowerCase()
            );
            if (matchCls) matchClassId = String(matchCls.id);
          }
          return { formalLembagaId: String(matchLem.id), formalClassId: matchClassId };
        }
      }
    }

    if (santri.kelas) {
      const santriClasses = santri.kelas.split(',').map(x => x.trim()).filter(Boolean);
      for (const cName of santriClasses) {
        const matchCls = kelas.find(k => k.nama.trim().toLowerCase() === cName.toLowerCase());
        if (matchCls) {
          const lemId = getLemId(matchCls);
          const matchLem = formalLembagas.find(l => String(l.id) === lemId);
          if (matchLem) {
            const matchClassId = (cName.toLowerCase() === 'calon peserta didik' || cName.toLowerCase() === 'calon pelajar')
              ? 'calon'
              : String(matchCls.id);
            return { formalLembagaId: String(matchLem.id), formalClassId: matchClassId };
          }
        }
      }
    }

    return { formalLembagaId: '', formalClassId: 'calon' };
  };

  const calculateAgeAsOfReference = (birthDateStr?: string, refDay?: number, refMonth?: number): number | null => {
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
      const currentYear = new Date().getFullYear();
      const targetDay = refDay || 1;
      const targetMonth = (refMonth || 7) - 1;
      const referenceDate = new Date(currentYear, targetMonth, targetDay);
      let age = referenceDate.getFullYear() - birthDate.getFullYear();
      const m = referenceDate.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && referenceDate.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen, currentStep, editingSantri?.id]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Helper to format string to Title Case
  const titleCase = (str: string) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => {
        if (['dki', 'diy', 'rt', 'rw', 'dpr', 'dprd'].includes(word)) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  // Address Cascading states (API with Local Mock Fallback)
  const [provincesList, setProvincesList] = useState<{ id: string; name: string }[]>([]);
  const [regenciesList, setRegenciesList] = useState<{ id: string; name: string }[]>([]);
  const [districtsList, setDistrictsList] = useState<{ id: string; name: string }[]>([]);
  const [villagesList, setVillagesList] = useState<{ id: string; name: string }[]>([]);

  const [selectedProvId, setSelectedProvId] = useState('');
  const [selectedKabId, setSelectedKabId] = useState('');
  const [selectedKecId, setSelectedKecId] = useState('');

  const [loadingProv, setLoadingProv] = useState(false);
  const [loadingKab, setLoadingKab] = useState(false);
  const [loadingKec, setLoadingKec] = useState(false);
  const [loadingDes, setLoadingDes] = useState(false);

  // Fetch Provinces
  useEffect(() => {
    if (isOpen) {
      setLoadingProv(true);
      fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const formatted = data.map((item: any) => ({
              id: item.id,
              name: titleCase(item.name)
            }));
            setProvincesList(formatted);
          } else {
            throw new Error('Data format invalid');
          }
          setLoadingProv(false);
        })
        .catch(err => {
          console.error("Error fetching provinces, falling back to mock:", err);
          const fallback = PROVINSI_OPTIONS.map((name, idx) => ({
            id: String(idx + 1),
            name
          }));
          setProvincesList(fallback);
          setLoadingProv(false);
        });
    }
  }, [isOpen]);

  // Sync selectedProvId when form.provinsi changes
  useEffect(() => {
    if (form.provinsi && provincesList.length > 0) {
      const match = provincesList.find(p => p.name.toLowerCase() === form.provinsi.toLowerCase());
      if (match) {
        setSelectedProvId(match.id);
      } else {
        setSelectedProvId('');
        setRegenciesList([]);
      }
    } else {
      setSelectedProvId('');
      setRegenciesList([]);
    }
  }, [form.provinsi, provincesList]);

  // Fetch Regencies
  useEffect(() => {
    if (selectedProvId) {
      setLoadingKab(true);
      const isMock = parseInt(selectedProvId) <= 10;
      if (isMock) {
        const provName = provincesList.find(p => p.id === selectedProvId)?.name || '';
        const fallbackList = (KABUPATEN_MAP[provName] || []).map((name, idx) => ({
          id: `${selectedProvId}-${idx}`,
          name
        }));
        setRegenciesList(fallbackList);
        setLoadingKab(false);
        return;
      }

      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvId}.json`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const formatted = data.map((item: any) => ({
              id: item.id,
              name: titleCase(item.name)
            }));
            setRegenciesList(formatted);
          } else {
            throw new Error('Data format invalid');
          }
          setLoadingKab(false);
        })
        .catch(err => {
          console.error("Error fetching regencies, falling back to mock:", err);
          const provName = provincesList.find(p => p.id === selectedProvId)?.name || '';
          const fallbackList = (KABUPATEN_MAP[provName] || []).map((name, idx) => ({
            id: `${selectedProvId}-${idx}`,
            name
          }));
          setRegenciesList(fallbackList);
          setLoadingKab(false);
        });
    } else {
      setRegenciesList([]);
    }
  }, [selectedProvId, provincesList]);

  // Sync selectedKabId when form.kabupaten changes
  useEffect(() => {
    if (form.kabupaten && regenciesList.length > 0) {
      const match = regenciesList.find(r => r.name.toLowerCase() === form.kabupaten.toLowerCase());
      if (match) {
        setSelectedKabId(match.id);
      } else {
        setSelectedKabId('');
        setDistrictsList([]);
      }
    } else {
      setSelectedKabId('');
      setDistrictsList([]);
    }
  }, [form.kabupaten, regenciesList]);

  // Fetch Districts
  useEffect(() => {
    if (selectedKabId) {
      setLoadingKec(true);
      const isMock = selectedKabId.includes('-');
      if (isMock) {
        const kabName = regenciesList.find(r => r.id === selectedKabId)?.name || '';
        const fallbackList = (KECAMATAN_MAP[kabName] || []).map((name, idx) => ({
          id: `${selectedKabId}-${idx}`,
          name
        }));
        setDistrictsList(fallbackList);
        setLoadingKec(false);
        return;
      }

      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedKabId}.json`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const formatted = data.map((item: any) => ({
              id: item.id,
              name: titleCase(item.name)
            }));
            setDistrictsList(formatted);
          } else {
            throw new Error('Data format invalid');
          }
          setLoadingKec(false);
        })
        .catch(err => {
          console.error("Error fetching districts, falling back to mock:", err);
          const kabName = regenciesList.find(r => r.id === selectedKabId)?.name || '';
          const fallbackList = (KECAMATAN_MAP[kabName] || []).map((name, idx) => ({
            id: `${selectedKabId}-${idx}`,
            name
          }));
          setDistrictsList(fallbackList);
          setLoadingKec(false);
        });
    } else {
      setDistrictsList([]);
    }
  }, [selectedKabId, regenciesList]);

  // Sync selectedKecId when form.kecamatan changes
  useEffect(() => {
    if (form.kecamatan && districtsList.length > 0) {
      const match = districtsList.find(d => d.name.toLowerCase() === form.kecamatan.toLowerCase());
      if (match) {
        setSelectedKecId(match.id);
      } else {
        setSelectedKecId('');
        setVillagesList([]);
      }
    } else {
      setSelectedKecId('');
      setVillagesList([]);
    }
  }, [form.kecamatan, districtsList]);

  // Fetch Villages
  useEffect(() => {
    if (selectedKecId) {
      setLoadingDes(true);
      const isMock = selectedKecId.includes('-');
      if (isMock) {
        const kecName = districtsList.find(d => d.id === selectedKecId)?.name || '';
        const fallbackList = (DESA_MAP[kecName] || []).map((name, idx) => ({
          id: `${selectedKecId}-${idx}`,
          name
        }));
        setVillagesList(fallbackList);
        setLoadingDes(false);
        return;
      }

      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedKecId}.json`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const formatted = data.map((item: any) => ({
              id: item.id,
              name: titleCase(item.name)
            }));
            setVillagesList(formatted);
          } else {
            throw new Error('Data format invalid');
          }
          setLoadingDes(false);
        })
        .catch(err => {
          console.error("Error fetching villages, falling back to mock:", err);
          const kecName = districtsList.find(d => d.id === selectedKecId)?.name || '';
          const fallbackList = (DESA_MAP[kecName] || []).map((name, idx) => ({
            id: `${selectedKecId}-${idx}`,
            name
          }));
          setVillagesList(fallbackList);
          setLoadingDes(false);
        });
    } else {
      setVillagesList([]);
    }
  }, [selectedKecId, districtsList]);

  // Load editing student data if in edit mode
  useEffect(() => {
    if (isOpen) {
      if (editingSantri) {
        let prov = editingSantri.provinsi || '';
        let kab = editingSantri.kabupaten || '';
        let kec = editingSantri.kecamatan || '';
        let des = editingSantri.desa || '';

        if (!prov && editingSantri.asal) {
          const parts = editingSantri.asal.split(',').map(x => x.trim());
          if (parts.length >= 2) {
            kab = parts[0];
            prov = parts[1];
          } else if (parts.length === 1) {
            kab = parts[0];
          }
        }

        setForm({
          nama: editingSantri.nama || '',
          nis: editingSantri.nis || '',
          nisn: formatBigDigit(editingSantri.nisn),
          nism: formatBigDigit(editingSantri.nism),
          nik: formatBigDigit(editingSantri.nik),
          noKk: formatBigDigit(editingSantri.noKk),
          tempatLahir: editingSantri.tempatLahir || '',
          tanggalLahir: editingSantri.tanggalLahir || '',
          gender: editingSantri.gender || 'Putra',
          anakKe: String(editingSantri.anakKe !== undefined ? editingSantri.anakKe : 0),
          dariBersaudara: String(editingSantri.dariBersaudara !== undefined ? editingSantri.dariBersaudara : 0),
          
          namaAyah: editingSantri.namaAyah || '',
          nikAyah: formatBigDigit(editingSantri.nikAyah),
          pekerjaanAyah: editingSantri.pekerjaanAyah || '',
          pendidikanAyah: editingSantri.pendidikanAyah || '',
          namaIbu: editingSantri.namaIbu || '',
          nikIbu: formatBigDigit(editingSantri.nikIbu),
          pekerjaanIbu: editingSantri.pekerjaanIbu || '',
          pendidikanIbu: editingSantri.pendidikanIbu || '',

          alamat: editingSantri.alamat || '',
          rt: formatBigDigit(editingSantri.rt),
          rw: formatBigDigit(editingSantri.rw),
          desa: des,
          kecamatan: kec,
          kabupaten: kab,
          provinsi: prov,
          jarakRumah: String(editingSantri.jarakRumah !== undefined ? editingSantri.jarakRumah : 0),
          noHp: formatBigDigit(editingSantri.noHp),

          statusKeanggotaan: editingSantri.statusKeanggotaan || 'Aktif',
          statusDomisili: editingSantri.statusDomisili || 'Muqim',
          statusEmis: editingSantri.statusEmis || 'Belum',
          statusVerval: editingSantri.statusVerval || 'Proses',
          kelas: editingSantri.kelas || '',
          kamar: editingSantri.kamar || '',
          tanggalMasuk: editingSantri.tanggalMasuk || '',
          tanggalKeluar: editingSantri.tanggalKeluar || '',
          catatan: editingSantri.catatan || '',
          pendidikanTerakhir: editingSantri.pendidikanTerakhir || '',

          fileKk: editingSantri.fileKk || '',
          fileKtp: editingSantri.fileKtp || '',
          fileAkta: editingSantri.fileAkta || '',
          fileIjazah: editingSantri.fileIjazah || '',
          filePasFoto: (editingSantri.filePasFoto && editingSantri.filePasFoto !== PUTRA_AVATAR && editingSantri.filePasFoto !== PUTRI_AVATAR) ? editingSantri.filePasFoto : '',
          pendidikanInternal: editingSantri.pendidikanInternal || '',
          pendidikanFormalLembagaId: extractFormalData(editingSantri, lembagasList, kelasList).formalLembagaId,
          pendidikanFormalClassId: extractFormalData(editingSantri, lembagasList, kelasList).formalClassId
        });

        const hasCustomPasFoto = editingSantri.filePasFoto && 
          editingSantri.filePasFoto !== PUTRA_AVATAR && 
          editingSantri.filePasFoto !== PUTRI_AVATAR;

        setFileNames({
          fileKk: editingSantri.fileKk ? 'kartu_keluarga.pdf' : '',
          fileKtp: editingSantri.fileKtp ? 'ktp_santri.pdf' : '',
          fileAkta: editingSantri.fileAkta ? 'akta_kelahiran.pdf' : '',
          fileIjazah: editingSantri.fileIjazah ? 'ijazah.pdf' : '',
          filePasFoto: hasCustomPasFoto ? 'pas_foto.jpg' : ''
        });
      } else {
        let defaultGender: 'Putra' | 'Putri' | '' = '';
        if (activeGenderFilter === 'Putra' && canWritePutra) {
          defaultGender = 'Putra';
        } else if (activeGenderFilter === 'Putri' && canWritePutri) {
          defaultGender = 'Putri';
        } else {
          if (canWritePutra && !canWritePutri) {
            defaultGender = 'Putra';
          } else if (!canWritePutra && canWritePutri) {
            defaultGender = 'Putri';
          } else {
            defaultGender = '';
          }
        }
        setForm({
          ...initialFormState,
          gender: defaultGender
        });
        setFileNames({});
      }
      setCurrentStep(1);
      setStepErrors([]);
    }
  }, [isOpen, editingSantri, activeGenderFilter, canWritePutra, canWritePutri]);

  // Dynamic NIS auto-generation based on entryYear and registration order
  useEffect(() => {
    if (isOpen && !editingSantri) {
      const entryYear = form.tanggalMasuk ? form.tanggalMasuk.split('-')[0] : new Date().getFullYear().toString();
      const prefix = entryYear; // 4 digits year, e.g. '2026'
      
      const sameYearSantris = (santriList || []).filter(s => {
        const sYear = s.tanggalMasuk ? s.tanggalMasuk.split('-')[0] : '';
        if (sYear === entryYear) return true;
        if (s.nis && s.nis.startsWith(prefix) && s.nis.length === 7) return true;
        return false;
      });

      const sequences = sameYearSantris
        .map(s => {
          if (s.nis && s.nis.startsWith(prefix) && s.nis.length === 7) {
            const seqPart = s.nis.slice(4);
            const parsed = parseInt(seqPart, 10);
            return isNaN(parsed) ? 0 : parsed;
          }
          return 0;
        })
        .filter(seq => seq > 0);

      const maxSeq = sequences.length > 0 ? Math.max(...sequences) : 0;
      const nextSeq = Math.max(maxSeq + 1, sameYearSantris.length + 1);
      const nextSeqStr = String(nextSeq).padStart(3, '0');
      const generated = prefix + nextSeqStr;

      if (!form.nis || form.nis === lastGeneratedNis) {
        if (form.nis !== generated) {
          // If the user hasn't edited the NIS, and the prefix remains the same but sequence changed
          if (form.nis && lastGeneratedNis && form.nis.slice(0, 4) === prefix && generated.slice(0, 4) === prefix) {
            setNisAdjustedNotification(`NIS otomatis disesuaikan menjadi ${generated} karena ada santri baru terdaftar.`);
            setTimeout(() => {
              setNisAdjustedNotification(null);
            }, 6500);
          }
          setForm(prev => ({ ...prev, nis: generated }));
        }
      }
      if (lastGeneratedNis !== generated) {
        setLastGeneratedNis(generated);
      }
    }
  }, [isOpen, editingSantri, form.tanggalMasuk, santriList, lastGeneratedNis]);

  useEffect(() => {
    if (editingSantri && lembagasList.length > 0) {
      const { formalLembagaId, formalClassId } = extractFormalData(editingSantri, lembagasList, kelasList);
      if (formalLembagaId) {
        setForm(prev => ({
          ...prev,
          pendidikanFormalLembagaId: prev.pendidikanFormalLembagaId || formalLembagaId,
          pendidikanFormalClassId: prev.pendidikanFormalLembagaId ? prev.pendidikanFormalClassId : formalClassId
        }));
      }
    }
  }, [editingSantri, lembagasList, kelasList]);

  const generateNisForCurrentForm = () => {
    if (!form.tanggalMasuk || form.tanggalMasuk.trim() === "") return;
    
    const entryYear = form.tanggalMasuk.split('-')[0];
    const prefix = entryYear; // 4 digits year, e.g. '2026'
    
    const sameYearSantris = (santriList || []).filter(s => {
      const sYear = s.tanggalMasuk ? s.tanggalMasuk.split('-')[0] : '';
      if (sYear === entryYear) return true;
      if (s.nis && s.nis.startsWith(prefix) && s.nis.length === 7) return true;
      return false;
    });

    const sequences = sameYearSantris
      .map(s => {
        if (s.nis && s.nis.startsWith(prefix) && s.nis.length === 7) {
          const seqPart = s.nis.slice(4);
          const parsed = parseInt(seqPart, 10);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      })
      .filter(seq => seq > 0);

    const maxSeq = sequences.length > 0 ? Math.max(...sequences) : 0;
    const nextSeq = Math.max(maxSeq + 1, sameYearSantris.length + 1);
    const nextSeqStr = String(nextSeq).padStart(3, '0');
    const generated = prefix + nextSeqStr;
    
    setForm(prev => ({ ...prev, nis: generated }));
  };

  // Validation Handlers
  const handleTextOnlyChange = (field: keyof typeof form, val: string) => {
    const cleaned = val.replace(/[^a-zA-Z\s'.]/g, '');
    setForm(prev => ({ ...prev, [field]: cleaned }));
  };

  const handleNumericOnlyChange = (field: keyof typeof form, val: string, maxLength?: number) => {
    let cleaned = val.replace(/\D/g, '');
    if (maxLength) {
      cleaned = cleaned.slice(0, maxLength);
    }
    setForm(prev => ({ ...prev, [field]: cleaned }));
  };

  const handleRtRwBlur = (field: 'rt' | 'rw') => {
    const val = form[field];
    if (val) {
      const padded = val.padStart(3, '0');
      setForm(prev => ({ ...prev, [field]: padded }));
    }
  };

  const getFieldValidationErrors = () => {
    const errors: Record<string, string> = {};
    if (form.nik && form.nik.length !== 16) {
      errors.nik = "NIK harus terdiri dari 16 digit angka";
    }
    if (form.noKk && form.noKk.length !== 16) {
      errors.noKk = "Nomor KK harus terdiri dari 16 digit angka";
    }
    if (form.nis && form.nis.length !== 7) {
      errors.nis = "NIS harus terdiri dari 7 digit angka (4 digit tahun dan 3 digit nomor urut)";
    }
    if (form.nisn && form.nisn.length !== 10) {
      errors.nisn = "NISN harus terdiri dari 10 digit angka";
    }
    if (form.nism && form.nism.length !== 18) {
      errors.nism = "NISM harus terdiri dari 18 digit angka";
    }
    if (form.nikAyah && form.nikAyah.length !== 16) {
      errors.nikAyah = "NIK Ayah harus terdiri dari 16 digit angka";
    }
    if (form.nikIbu && form.nikIbu.length !== 16) {
      errors.nikIbu = "NIK Ibu harus terdiri dari 16 digit angka";
    }
    
    const isNisDuplicate = form.nis.trim() !== '' && (santriList || []).some(s => 
      s.nis === form.nis.trim() && (!editingSantri || s.id !== editingSantri.id)
    );
    if (isNisDuplicate) {
      errors.nis = "NIS sudah terdaftar untuk santri lain. Silakan gunakan NIS yang unik.";
    }
    
    return errors;
  };

  const validationErrors = getFieldValidationErrors();

  const isStepFilled = () => {
    if (currentStep === 1) {
      return !!(
        form.nama.trim() || 
        form.tempatLahir.trim() || 
        form.tanggalLahir || 
        form.noKk || 
        form.nik || 
        form.anakKe !== '0' || 
        form.dariBersaudara !== '0'
      );
    }
    if (currentStep === 2) {
      return !!(
        form.namaAyah.trim() || 
        form.nikAyah || 
        form.pekerjaanAyah.trim() || 
        form.namaIbu.trim() || 
        form.nikIbu || 
        form.pekerjaanIbu.trim()
      );
    }
    if (currentStep === 3) {
      return !!(
        form.alamat.trim() || 
        form.rt || 
        form.rw || 
        form.desa || 
        form.kecamatan || 
        form.kabupaten || 
        form.provinsi || 
        form.jarakRumah !== '0' || 
        form.noHp
      );
    }
    if (currentStep === 4) {
      return !!(
        form.nis.trim() || 
        form.nisn || 
        form.nism || 
        form.tanggalKeluar || 
        form.catatan.trim()
      );
    }
    if (currentStep === 5) {
      return !!(
        form.fileKk || 
        form.fileKtp || 
        form.fileAkta || 
        form.fileIjazah || 
        form.filePasFoto
      );
    }
    return false;
  };

  const isAnyFieldFilled = () => {
    return !!(
      form.nama.trim() || 
      form.tempatLahir.trim() || 
      form.tanggalLahir || 
      form.noKk || 
      form.nik || 
      form.namaAyah.trim() || 
      form.nikAyah || 
      form.pekerjaanAyah.trim() || 
      form.namaIbu.trim() || 
      form.nikIbu || 
      form.pekerjaanIbu.trim() ||
      form.alamat.trim() || 
      form.rt || 
      form.rw || 
      form.desa || 
      form.kecamatan || 
      form.kabupaten || 
      form.provinsi || 
      form.noHp ||
      form.nis.trim() || 
      form.nisn || 
      form.nism || 
      form.tanggalKeluar || 
      form.catatan.trim() ||
      form.fileKk || 
      form.fileKtp || 
      form.fileAkta || 
      form.fileIjazah || 
      form.filePasFoto
    );
  };

  const handleNextStep = () => {
    setStepErrors([]);
    const errors: string[] = [];
    
    if (currentStep === 1) {
      if (!form.nama.trim()) errors.push("Nama Lengkap Santri wajib diisi");
      if (!form.gender) errors.push("Jenis Kelamin wajib dipilih");
      if (validationErrors.noKk) errors.push(validationErrors.noKk);
      if (validationErrors.nik) errors.push(validationErrors.nik);
    } else if (currentStep === 2) {
      if (validationErrors.nikAyah) errors.push(validationErrors.nikAyah);
      if (validationErrors.nikIbu) errors.push(validationErrors.nikIbu);
    } else if (currentStep === 4) {
      if (validationErrors.nisn) errors.push(validationErrors.nisn);
      if (validationErrors.nism) errors.push(validationErrors.nism);
      if (validationErrors.nis) errors.push(validationErrors.nis);
    }

    if (errors.length > 0) {
      setStepErrors(errors);
      return;
    }
    
    setCurrentStep(prev => Math.min(5, prev + 1));
  };

  const handlePrevStep = () => {
    setStepErrors([]);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    const errors: string[] = [];

    // Step 1 validation - Nama Lengkap & Jenis Kelamin wajib
    if (!form.nama.trim()) {
      errors.push("Nama Lengkap Santri wajib diisi");
    }
    if (!form.gender) {
      errors.push("Jenis Kelamin wajib dipilih");
    }

    if (errors.length > 0) {
      setStepErrors(errors);
      setCurrentStep(1);
      setTimeout(() => {
        const inputId = !form.nama.trim() ? "nama-input" : "";
        if (inputId) {
          const input = document.getElementById(inputId);
          if (input) {
            (input as HTMLInputElement).focus();
            (input as HTMLInputElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 150);
      return;
    }

    // Check formatting validation errors across all fields
    const valErrors = getFieldValidationErrors();
    if (Object.keys(valErrors).length > 0) {
      const firstField = Object.keys(valErrors)[0];
      let targetStep = 1;
      
      if (['nik', 'noKk'].includes(firstField)) {
        targetStep = 1;
      } else if (['nikAyah', 'nikIbu'].includes(firstField)) {
        targetStep = 2;
      } else if (['nisn', 'nism', 'nis'].includes(firstField)) {
        targetStep = 4;
      }
      
      setStepErrors(Object.values(valErrors));
      setCurrentStep(targetStep);
      
      setTimeout(() => {
        const input = document.getElementById(`${firstField}-input`);
        if (input) {
          (input as HTMLInputElement).focus();
          (input as HTMLInputElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return;
    }

    // Keep NIS empty if left blank (will be stored as NULL in database)
    const generatedNis = form.nis.trim() || '';

    // Calculate synchronized classes based on selected formal education & pendidikanInternal
    let finalClasses = form.kelas ? form.kelas.split(',').map(x => x.trim()).filter(Boolean) : [];
    finalClasses = finalClasses.filter(c => c.toLowerCase() !== 'tanpa kelas');

    // Remove any classes that belong to formal institutions
    const formalLembagaIds = lembagasList.filter(l => getLembagaJenis(l) === 'Formal').map(l => String(l.id));
    finalClasses = finalClasses.filter(clsName => {
      const cls = kelasList.find(k => k.nama.toLowerCase() === clsName.toLowerCase());
      if (cls) {
        if (formalLembagaIds.includes(getLemId(cls))) {
          return false;
        }
      }
      return true;
    });

    let formalStr: string | undefined = undefined;

    if (form.pendidikanFormalLembagaId) {
      const targetLembaga = lembagasList.find(l => String(l.id) === String(form.pendidikanFormalLembagaId));
      if (targetLembaga) {
        let targetClassName = 'Calon Peserta Didik';
        if (form.statusEmis === 'Terdaftar' && form.pendidikanFormalClassId && form.pendidikanFormalClassId !== 'calon') {
          const targetClass = kelasList.find(k => 
            String(k.id) === String(form.pendidikanFormalClassId) || 
            k.nama.toLowerCase() === form.pendidikanFormalClassId.toLowerCase()
          );
          if (targetClass) {
            targetClassName = targetClass.nama;
          }
        }
        
        finalClasses.push(targetClassName);
        formalStr = `${targetLembaga.nama} - ${targetClassName}`;
      }
    }

    const internalLembagaIds = form.pendidikanInternal 
      ? form.pendidikanInternal.split(',').map(x => String(x.trim())).filter(Boolean) 
      : [];

    // Remove any classes that belong to internal institutions NOT selected anymore
    finalClasses = finalClasses.filter(clsName => {
      const cls = kelasList.find(k => k.nama.toLowerCase() === clsName.toLowerCase());
      if (cls) {
        const lemOfCls = lembagasList.find(l => String(l.id) === getLemId(cls));
        if (lemOfCls && getLembagaJenis(lemOfCls) === 'Internal') {
          return internalLembagaIds.includes(getLemId(cls));
        }
      }
      return true;
    });

    // Make sure each selected internal institution has at least one class
    for (const internalId of internalLembagaIds) {
      const hasClassForThisInternal = finalClasses.some(clsName => {
        const lower = clsName.toLowerCase();
        if (lower === 'calon peserta didik' || lower === 'calon pelajar') return true;
        const cls = kelasList.find(k => k.nama.toLowerCase() === lower);
        if (cls) {
          return getLemId(cls) === internalId;
        }
        return true;
      });

      if (!hasClassForThisInternal) {
        const defaultClass = kelasList.find(k => getLemId(k) === internalId && isDefaultClass(k));
        if (defaultClass) {
          finalClasses.push(defaultClass.nama);
        } else {
          finalClasses.push('Calon Peserta Didik');
        }
      }
    }

    // If santri has a specific class (e.g. "7A"), strip out any leftover "Calon Peserta Didik"
    const hasSpecificClass = finalClasses.some(c => {
      const lower = c.trim().toLowerCase();
      return lower !== 'calon peserta didik' && lower !== 'calon pelajar' && lower !== 'tanpa kelas';
    });
    if (hasSpecificClass) {
      finalClasses = finalClasses.filter(c => {
        const lower = c.trim().toLowerCase();
        return lower !== 'calon peserta didik' && lower !== 'calon pelajar';
      });
    }

    const uniqueClasses = Array.from(new Set(finalClasses));
    const finalKelasString = uniqueClasses.join(', ') || 'Tanpa Kelas';

    const entry: Santri = {
      id: editingSantri ? editingSantri.id : `S${Date.now()}`,
      nis: generatedNis,
      nama: form.nama,
      kelas: finalKelasString,
      kamar: form.kamar,
      asal: (form.kabupaten && form.provinsi) 
        ? `${form.kabupaten}, ${form.provinsi}` 
        : (form.kabupaten || form.provinsi || '-'),
      gender: (form.gender || 'Putra') as 'Putra' | 'Putri',
      tanggalMasuk: form.tanggalMasuk,
      
      nisn: form.nisn,
      nism: form.nism,
      nik: form.nik,
      noKk: form.noKk,
      tempatLahir: form.tempatLahir,
      tanggalLahir: form.tanggalLahir,
      anakKe: Number(form.anakKe),
      dariBersaudara: Number(form.dariBersaudara),
      
      namaAyah: form.namaAyah,
      nikAyah: form.nikAyah,
      pekerjaanAyah: form.pekerjaanAyah,
      pendidikanAyah: form.pendidikanAyah,
      namaIbu: form.namaIbu,
      nikIbu: form.nikIbu,
      pekerjaanIbu: form.pekerjaanIbu,
      pendidikanIbu: form.pendidikanIbu,

      alamat: form.alamat,
      rt: form.rt,
      rw: form.rw,
      desa: form.desa,
      kecamatan: form.kecamatan,
      kabupaten: form.kabupaten,
      provinsi: form.provinsi,
      jarakRumah: Math.min(Math.max(0, Number(form.jarakRumah || 0)), 999.99),
      noHp: form.noHp,

      statusKeanggotaan: form.statusKeanggotaan,
      statusDomisili: form.statusKeanggotaan === 'Aktif' ? form.statusDomisili : undefined,
      statusEmis: form.statusEmis || 'Belum',
      statusVerval: form.statusEmis === 'Terdaftar' ? (form.statusVerval || 'Proses') : 'Proses',
      tanggalKeluar: (form.statusKeanggotaan === 'Alumni' || form.statusKeanggotaan === 'Meninggal') ? (form.tanggalKeluar || undefined) : undefined,
      catatan: form.catatan || undefined,
      pendidikanTerakhir: form.pendidikanTerakhir,

      fileKk: form.fileKk || undefined,
      fileKtp: form.fileKtp || undefined,
      fileAkta: form.fileAkta || undefined,
      fileIjazah: form.fileIjazah || undefined,
      filePasFoto: form.filePasFoto || '',
      pendidikanInternal: form.pendidikanInternal || undefined,
      pendidikanFormal: formalStr
    };

    if (editingSantri) {
      if (onUpdateSantri) {
        onUpdateSantri(entry);
      }
    } else {
      onAddSantri(entry);
    }
    
    setForm(initialFormState);
    setFileNames({});
    setCurrentStep(1);
    setStepErrors([]);
    onClose();
  };

  const modalContent = (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-3 sm:p-4">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.05, ease: 'linear' }}
              className="relative flex flex-col w-full max-w-4xl h-[85vh] sm:h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden border-0 outline-none focus:outline-none focus-within:outline-none"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between bg-[#0f8a3c] px-6 py-4.5 rounded-t-2xl">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {editingSantri ? "Edit Data Santri" : "Formulir Tambah Santri"}
                </h3>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Steps Progress Header Tracker */}
              <div className="bg-white border-b border-slate-200 px-6 py-4">
                {/* Desktop View: Show all 5 steps with direct click to switch */}
                <div className="hidden sm:flex w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-xs h-11">
                  {[
                    { step: 1, title: 'Data Diri' },
                    { step: 2, title: 'Orang tua' },
                    { step: 3, title: 'Alamat & Kontak' },
                    { step: 4, title: 'Akademik' },
                    { step: 5, title: 'Berkas' }
                  ].map((s, idx) => {
                    const isActive = currentStep === s.step;
                    const isCompleted = currentStep > s.step;
                    return (
                      <button 
                        type="button"
                        key={s.step} 
                        onClick={() => {
                          setStepErrors([]);
                          setCurrentStep(s.step);
                        }}
                        className={`relative flex flex-1 items-center justify-center gap-2 px-1 transition-all outline-none focus:outline-none cursor-pointer ${
                          isActive 
                            ? 'bg-emerald-50/55 font-bold text-emerald-800' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/20'
                        }`}
                      >
                        {/* Step Number Circle */}
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                          isActive 
                            ? 'border-emerald-600 bg-[#0f8a3c] text-white' 
                            : isCompleted 
                              ? 'border-[#0f8a3c] bg-emerald-50 text-[#0f8a3c]' 
                              : 'border-slate-300 text-slate-400 bg-slate-50'
                        }`}>
                          {isCompleted ? '✓' : s.step}
                        </div>
                        
                        {/* Step Title */}
                        <span className="hidden sm:inline text-[11.5px] font-semibold">{s.title}</span>
                        <span className="sm:hidden text-[10px] font-semibold">
                          {s.step === 1 ? 'Diri' : s.step === 2 ? 'Ortu' : s.step === 3 ? 'Alamat' : s.step === 4 ? 'Akademik' : 'Berkas'}
                        </span>

                        {/* Diagonal chevron separator line at the end of segment */}
                        {idx < 4 && (
                          <div className="absolute right-0 top-0 bottom-0 w-3 pointer-events-none overflow-hidden z-10">
                            <svg className="h-full w-full text-slate-200" viewBox="0 0 12 44" fill="none" preserveAspectRatio="none">
                              <path d="M0 -2L10 22L0 46" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Mobile View: Show only the current active tab with previous and next navigation controls */}
                <div className="flex sm:hidden items-center justify-between w-full rounded-xl border border-slate-200 bg-white h-11 px-2 select-none">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={currentStep === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <div className="flex items-center gap-2 font-bold text-emerald-800 text-xs">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0f8a3c] text-white text-[10px] font-bold">
                      {currentStep}
                    </span>
                    <span>
                      {currentStep === 1 ? 'Data Diri' : currentStep === 2 ? 'Orang tua' : currentStep === 3 ? 'Alamat & Kontak' : currentStep === 4 ? 'Akademik' : 'Berkas'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">({currentStep}/5)</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={currentStep === 5}
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Wizard Form Content Area */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white">

                {/* STEP 1: IDENTITAS SANTRI */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                      {/* 1. Nama Lengkap */}
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nama Lengkap: <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          id="nama-input"
                          value={form.nama}
                          onChange={(e) => handleTextOnlyChange('nama', e.target.value)}
                          placeholder="Contoh: Muhammad Akhyar"
                          className={`select-text w-full rounded-lg border bg-white p-2.5 text-sm focus:ring-1 outline-none ${
                            stepErrors.includes("Nama Lengkap Santri wajib diisi") 
                              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' 
                              : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-600'
                          }`}
                        />
                        {stepErrors.includes("Nama Lengkap Santri wajib diisi") && (
                          <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                            <span className="inline-block w-1 h-1 rounded-full bg-rose-600"></span>
                            Nama Lengkap Santri wajib diisi
                          </p>
                        )}
                      </div>

                      {/* 2. Jenis Kelamin */}
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Jenis Kelamin: <span className="text-red-500">*</span></label>
                        <select
                          value={form.gender}
                          onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                          className={`w-full rounded-lg border bg-white p-2.5 text-sm focus:ring-1 outline-none appearance-none ${
                            stepErrors.includes("Jenis Kelamin wajib dipilih") 
                              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' 
                              : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-600'
                          }`}
                          style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
                        >
                          <option value="">-- Pilih Jenis Kelamin --</option>
                          {(editingSantri || canWritePutra) && (
                            <option value="Putra">Laki-laki (Putra)</option>
                          )}
                          {(editingSantri || canWritePutri) && (
                            <option value="Putri">Perempuan (Putri)</option>
                          )}
                        </select>
                        {stepErrors.includes("Jenis Kelamin wajib dipilih") && (
                          <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                            <span className="inline-block w-1 h-1 rounded-full bg-rose-600"></span>
                            Jenis Kelamin wajib dipilih
                          </p>
                        )}
                      </div>

                      {/* 3. Tempat Lahir */}
                      <div className="sm:col-span-1">
                        <SearchableSelect
                          id="tempat-lahir-input"
                          label="Tempat Lahir"
                          value={form.tempatLahir}
                          placeholder="Ketik & pilih Kota/Kabupaten..."
                          options={TEMPAT_LAHIR_OPTIONS_LIST}
                          onChange={(val) => setForm(prev => ({ ...prev, tempatLahir: val }))}
                        />
                      </div>

                      {/* 4. Tanggal Lahir */}
                      <div className="sm:col-span-1">
                        <BirthDatePicker
                          id="tanggal-lahir-input"
                          label="Tanggal Lahir"
                          required={false}
                          value={form.tanggalLahir}
                          onChange={(isoDate) => setForm(prev => ({ ...prev, tanggalLahir: isoDate }))}
                        />
                      </div>

                      {/* 5. No KK */}
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">No KK:</label>
                        <input
                          type="text"
                          id="noKk-input"
                          value={form.noKk}
                          onChange={(e) => handleNumericOnlyChange('noKk', e.target.value, 16)}
                          placeholder="Masukkan 16 digit No. KK"
                          className={`select-text w-full rounded-lg border bg-white p-2.5 text-sm focus:ring-1 outline-none font-mono ${
                            validationErrors.noKk 
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 text-rose-900 placeholder-rose-300' 
                              : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-600'
                          }`}
                        />
                        {validationErrors.noKk && (
                          <p className="mt-1 text-[10px] text-rose-600 font-semibold">{validationErrors.noKk}</p>
                        )}
                      </div>

                      {/* 6. NIK */}
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">NIK:</label>
                        <input
                          type="text"
                          id="nik-input"
                          value={form.nik}
                          onChange={(e) => handleNumericOnlyChange('nik', e.target.value, 16)}
                          placeholder="Masukkan 16 digit NIK"
                          className={`select-text w-full rounded-lg border bg-white p-2.5 text-sm focus:ring-1 outline-none font-mono ${
                            validationErrors.nik 
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 text-rose-900 placeholder-rose-300' 
                              : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-600'
                          }`}
                        />
                        {validationErrors.nik && (
                          <p className="mt-1 text-[10px] text-rose-600 font-semibold">{validationErrors.nik}</p>
                        )}
                      </div>

                      {/* 7. Anak Ke */}
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Anak Ke:</label>
                        <input
                          type="number"
                          min="1"
                          value={form.anakKe ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm({
                              ...form,
                              anakKe: val
                            });
                          }}
                          onFocus={(e) => e.currentTarget.select()}
                          onClick={(e) => e.currentTarget.select()}
                          className="select-text w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                        />
                      </div>

                      {/* 8. Jumlah Saudara */}
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Jumlah Saudara:</label>
                        <input
                          type="number"
                          min="0"
                          value={form.dariBersaudara ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm({
                              ...form,
                              dariBersaudara: val
                            });
                          }}
                          onFocus={(e) => e.currentTarget.select()}
                          onClick={(e) => e.currentTarget.select()}
                          className="select-text w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: DATA ORANG TUA */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-4 border border-slate-100 bg-white p-5 rounded-2xl">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Lengkap Ayah</label>
                          <input
                            type="text"
                            id="nama-ayah-input"
                            value={form.namaAyah}
                            onChange={(e) => handleTextOnlyChange('namaAyah', e.target.value)}
                            placeholder="Nama Lengkap Ayah"
                            className="select-text w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NIK Ayah</label>
                          <input
                            type="text"
                            id="nikAyah-input"
                            value={form.nikAyah}
                            onChange={(e) => handleNumericOnlyChange('nikAyah', e.target.value, 16)}
                            placeholder="16 Digit NIK Ayah"
                            className={`select-text w-full rounded-xl border bg-white p-3 text-sm outline-none font-mono ${
                              validationErrors.nikAyah 
                                ? 'border-rose-400 focus:border-rose-500 text-rose-900 placeholder-rose-300' 
                                : 'border-slate-200 focus:border-emerald-500'
                            }`}
                          />
                          {validationErrors.nikAyah && (
                            <p className="mt-1 text-[10px] text-rose-600 font-semibold">{validationErrors.nikAyah}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <SearchableSelect
                              id="pekerjaan-ayah-input"
                              label="Pekerjaan Ayah"
                              value={form.pekerjaanAyah}
                              placeholder="Ketik & pilih pekerjaan..."
                              options={PEKERJAAN_OPTIONS}
                              onChange={(val) => setForm(prev => ({ ...prev, pekerjaanAyah: val }))}
                            />
                          </div>
                          <div>
                            <SearchableSelect
                              id="pendidikan-ayah-input"
                              label="Pendidikan Terakhir"
                              value={form.pendidikanAyah}
                              placeholder="Ketik & pilih pendidikan..."
                              options={PENDIDIKAN_ORTU_OPTIONS}
                              onChange={(val) => setForm(prev => ({ ...prev, pendidikanAyah: val }))}
                            />
                          </div>
                        </div>
                      </div>
 
                      <div className="space-y-4 border border-slate-100 bg-white p-5 rounded-2xl">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Lengkap Ibu</label>
                          <input
                            type="text"
                            id="nama-ibu-input"
                            value={form.namaIbu}
                            onChange={(e) => handleTextOnlyChange('namaIbu', e.target.value)}
                            placeholder="Nama Lengkap Ibu"
                            className="select-text w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NIK Ibu</label>
                          <input
                            type="text"
                            id="nikIbu-input"
                            value={form.nikIbu}
                            onChange={(e) => handleNumericOnlyChange('nikIbu', e.target.value, 16)}
                            placeholder="16 Digit NIK Ibu"
                            className={`select-text w-full rounded-xl border bg-white p-3 text-sm outline-none font-mono ${
                              validationErrors.nikIbu 
                                ? 'border-rose-400 focus:border-rose-500 text-rose-900 placeholder-rose-300' 
                                : 'border-slate-200 focus:border-emerald-500'
                            }`}
                          />
                          {validationErrors.nikIbu && (
                            <p className="mt-1 text-[10px] text-rose-600 font-semibold">{validationErrors.nikIbu}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <SearchableSelect
                              id="pekerjaan-ibu-input"
                              label="Pekerjaan Ibu"
                              value={form.pekerjaanIbu}
                              placeholder="Ketik & pilih pekerjaan..."
                              options={PEKERJAAN_OPTIONS}
                              onChange={(val) => setForm(prev => ({ ...prev, pekerjaanIbu: val }))}
                            />
                          </div>
                          <div>
                            <SearchableSelect
                              id="pendidikan-ibu-input"
                              label="Pendidikan Terakhir"
                              value={form.pendidikanIbu}
                              placeholder="Ketik & pilih pendidikan..."
                              options={PENDIDIKAN_ORTU_OPTIONS}
                              onChange={(val) => setForm(prev => ({ ...prev, pendidikanIbu: val }))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: ALAMAT & KONTAK */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    {/* HIERARCHICAL ADDRESS SELECTS + RT, RW & ALAMAT LENGKAP */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 bg-white/40 p-1.5 rounded-2xl">
                      <div className="sm:col-span-6">
                        <SearchableSelect
                          label="Provinsi"
                          value={form.provinsi}
                          options={provincesList}
                          loading={loadingProv}
                          placeholder="Ketik & pilih Provinsi..."
                          onChange={(val) => setForm({ 
                            ...form, 
                            provinsi: val,
                            kabupaten: '',
                            kecamatan: '',
                            desa: ''
                          })}
                        />
                      </div>

                      {/* Kabupaten is read-only / disabled until Provinsi selected */}
                      <div className="sm:col-span-6">
                        <SearchableSelect
                          label={
                            <span>
                              Kabupaten / Kota {!form.provinsi && <span className="text-[10px] text-amber-600 font-normal lowercase">(Pilih Provinsi Dahulu)</span>}
                            </span>
                          }
                          disabled={!form.provinsi}
                          value={form.kabupaten}
                          options={regenciesList}
                          loading={loadingKab}
                          placeholder="Ketik & pilih Kabupaten..."
                          onChange={(val) => setForm({ 
                            ...form, 
                            kabupaten: val,
                            kecamatan: '',
                            desa: ''
                          })}
                        />
                      </div>

                      {/* Kecamatan is read-only / disabled until Kabupaten selected */}
                      <div className="sm:col-span-6">
                        <SearchableSelect
                          label={
                            <span>
                              Kecamatan {!form.kabupaten && <span className="text-[10px] text-amber-600 font-normal lowercase">(Pilih Kabupaten Dahulu)</span>}
                            </span>
                          }
                          disabled={!form.kabupaten}
                          value={form.kecamatan}
                          options={districtsList}
                          loading={loadingKec}
                          placeholder="Ketik & pilih Kecamatan..."
                          onChange={(val) => setForm({ 
                            ...form, 
                            kecamatan: val,
                            desa: ''
                          })}
                        />
                      </div>

                      {/* Desa is read-only / disabled until Kecamatan selected */}
                      <div className="sm:col-span-6">
                        <SearchableSelect
                          label={
                            <span>
                              Desa / Kelurahan {!form.kecamatan && <span className="text-[10px] text-amber-600 font-normal lowercase">(Pilih Kecamatan Dahulu)</span>}
                            </span>
                          }
                          disabled={!form.kecamatan}
                          value={form.desa}
                          options={villagesList}
                          loading={loadingDes}
                          placeholder="Ketik & pilih Desa/Kelurahan..."
                          onChange={(val) => setForm({ 
                            ...form, 
                            desa: val 
                          })}
                        />
                      </div>

                      {/* RT, RW, and Alamat Lengkap */}
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">RT</label>
                        <input
                          type="text"
                          value={form.rt}
                          onChange={(e) => handleNumericOnlyChange('rt', e.target.value, 3)}
                          onBlur={() => handleRtRwBlur('rt')}
                          placeholder="000"
                          className="select-text w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-emerald-500 outline-none font-mono"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">RW</label>
                        <input
                          type="text"
                          value={form.rw}
                          onChange={(e) => handleNumericOnlyChange('rw', e.target.value, 3)}
                          onBlur={() => handleRtRwBlur('rw')}
                          placeholder="000"
                          className="select-text w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-emerald-500 outline-none font-mono"
                        />
                      </div>

                      <div className="sm:col-span-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alamat Lengkap (Dusun / Jalan)</label>
                        <input
                          type="text"
                          id="alamat-input"
                          value={form.alamat}
                          onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                          placeholder="Contoh: Jl. Kyai Hasyim No. 12"
                          className="select-text w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Jarak dari Rumah and Nomor HP */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jarak dari Rumah (km)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={form.jarakRumah}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || Number(val) >= 0) {
                              setForm({ ...form, jarakRumah: val });
                            }
                          }}
                          onFocus={(e) => e.currentTarget.select()}
                          onClick={(e) => e.currentTarget.select()}
                          placeholder="Jarak tempuh"
                          className="select-text w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nomor HP / WA Aktif Wali</label>
                        <input
                          type="text"
                          id="no-hp-input"
                          value={form.noHp}
                          onChange={(e) => handleNumericOnlyChange('noHp', e.target.value, 14)}
                          placeholder="Contoh: 081234567890"
                          className="select-text w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-emerald-500 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: STATUS & ADMINISTRASI */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    {/* Identitas Akademik & Kependidikan */}
                    <div className="space-y-4">
                      {/* Baris 1: Pendidikan Terakhir & NISN */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <SearchableSelect
                            id="pendidikan-terakhir-input"
                            label="Pendidikan Terakhir"
                            value={form.pendidikanTerakhir}
                            placeholder="Ketik & pilih Pendidikan Terakhir..."
                            options={PENDIDIKAN_ANAK_OPTIONS}
                            onChange={(val) => setForm(prev => ({ ...prev, pendidikanTerakhir: val }))}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NISN</label>
                          <input
                            type="text"
                            id="nisn-input"
                            value={form.nisn}
                            onChange={(e) => handleNumericOnlyChange('nisn', e.target.value, 10)}
                            placeholder="10 digit NISN"
                            className={`select-text w-full rounded-xl border bg-white p-3 text-sm outline-none font-mono ${
                              validationErrors.nisn 
                                ? 'border-rose-400 focus:border-rose-500 text-rose-900 placeholder-rose-300' 
                                : 'border-slate-200 focus:border-emerald-500'
                            }`}
                          />
                          {validationErrors.nisn && (
                            <p className="mt-1 text-[10px] text-rose-600 font-semibold">{validationErrors.nisn}</p>
                          )}
                        </div>
                      </div>

                      {/* Baris 2: NIS & NISM */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nomor Induk Santri (NIS)</label>
                          <input
                            type="text"
                            id="nis-input"
                            value={form.nis}
                            onChange={(e) => handleNumericOnlyChange('nis', e.target.value, 7)}
                            placeholder="Contoh: 2026001"
                            className={`select-text w-full rounded-xl border p-3 text-sm focus:ring-1 outline-none font-mono ${
                              validationErrors.nis 
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 text-rose-900 bg-rose-50/10' 
                                : 'border-slate-200 focus:border-emerald-500'
                            }`}
                          />
                          {nisAdjustedNotification && (
                            <div className="mt-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2 flex items-start gap-1.5 font-sans font-medium animate-pulse">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                              <span>{nisAdjustedNotification}</span>
                            </div>
                          )}
                          {validationErrors.nis && (
                            <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1 bg-rose-50 border border-rose-100 rounded-lg p-2">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                              <span>{validationErrors.nis}</span>
                            </p>
                          )}
                          {editingSantri && (!form.nis || form.nis.trim() === "") && (
                            <div className="mt-2 text-left">
                              <button
                                type="button"
                                onClick={generateNisForCurrentForm}
                                disabled={!form.tanggalMasuk || form.tanggalMasuk.trim() === ""}
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer ${
                                  form.tanggalMasuk && form.tanggalMasuk.trim() !== ""
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                                }`}
                                title={(!form.tanggalMasuk || form.tanggalMasuk.trim() === "") ? "Silakan atur tanggal masuk terlebih dahulu" : "Generate NIS otomatis"}
                              >
                                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                                Generate NIS
                              </button>
                              {(!form.tanggalMasuk || form.tanggalMasuk.trim() === "") && (
                                <p className="text-[10px] text-amber-600 font-medium mt-1">
                                  *Harap atur tanggal masuk terlebih dahulu untuk men-generate NIS.
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NISM</label>
                          <input
                            type="text"
                            id="nism-input"
                            value={form.nism}
                            onChange={(e) => handleNumericOnlyChange('nism', e.target.value, 18)}
                            placeholder="18 digit NISM"
                            className={`select-text w-full rounded-xl border bg-white p-3 text-sm outline-none font-mono ${
                              validationErrors.nism 
                                ? 'border-rose-400 focus:border-rose-500 text-rose-900 placeholder-rose-300' 
                                : 'border-slate-200 focus:border-emerald-500'
                            }`}
                          />
                          {validationErrors.nism && (
                            <p className="mt-1 text-[10px] text-rose-600 font-semibold">{validationErrors.nism}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Keanggotaan</label>
                          <select
                            value={form.statusKeanggotaan}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setForm(prev => ({
                                ...prev,
                                statusKeanggotaan: val,
                                statusDomisili: val === 'Aktif' ? 'Muqim' : undefined,
                                tanggalKeluar: (val === 'Alumni' || val === 'Meninggal') 
                                  ? (prev.tanggalKeluar || new Date().toISOString().split('T')[0]) 
                                  : ''
                              }));
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm focus:border-emerald-500 outline-none"
                          >
                            <option value="Aktif">Aktif</option>
                            <option value="Alumni">Alumni</option>
                            <option value="Meninggal">Meninggal</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Domisili</label>
                          {form.statusKeanggotaan === 'Aktif' ? (
                            <select
                              value={form.statusDomisili || 'Muqim'}
                              onChange={(e) => setForm({ ...form, statusDomisili: e.target.value as any })}
                              className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm focus:border-emerald-500 outline-none"
                            >
                              <option value="Muqim">Muqim (Asrama)</option>
                              <option value="Kampung">Kampung (Non-Asrama)</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              disabled
                              value="Tidak Berlaku"
                              className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-sm text-slate-400 outline-none cursor-not-allowed"
                            />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <BirthDatePicker
                          label="Tanggal Masuk"
                          value={form.tanggalMasuk}
                          onChange={(isoDate) => setForm(prev => ({ ...prev, tanggalMasuk: isoDate }))}
                        />

                        {/* Tanggal Keluar */}
                        <BirthDatePicker
                          label={
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span>Tanggal Keluar / Wafat</span>
                              {form.statusKeanggotaan === 'Aktif' && (
                                <span className="text-[10px] text-slate-400 font-normal lowercase">(Khusus Alumni/Wafat)</span>
                              )}
                            </span>
                          }
                          disabled={form.statusKeanggotaan === 'Aktif'}
                          value={form.tanggalKeluar}
                          onChange={(isoDate) => setForm(prev => ({ ...prev, tanggalKeluar: isoDate }))}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Emis</label>
                          <select
                            value={form.statusEmis || 'Belum'}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setForm(prev => ({
                                ...prev,
                                statusEmis: val,
                                ...(val === 'Belum' ? { pendidikanFormalClassId: 'calon', statusVerval: 'Proses' } : {})
                              }));
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm focus:border-emerald-500 outline-none"
                          >
                            <option value="Terdaftar">Terdaftar</option>
                            <option value="Belum">Belum</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Verval</label>
                          <select
                            value={form.statusEmis === 'Terdaftar' ? (form.statusVerval || 'Proses') : 'Proses'}
                            disabled={form.statusEmis !== 'Terdaftar'}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setForm(prev => ({ ...prev, statusVerval: val }));
                            }}
                            className={`w-full rounded-xl border p-3.5 text-sm outline-none transition-colors ${
                              form.statusEmis !== 'Terdaftar' 
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                                : 'bg-white border-slate-200 focus:border-emerald-500'
                            }`}
                          >
                            <option value="Proses">Proses</option>
                            <option value="Sukses">Sukses</option>
                          </select>
                        </div>
                      </div>

                      {/* Segmen Aktivitas Akademik */}
                      <div className="border-t border-slate-200/80 pt-5 mt-4 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-4 w-1 bg-emerald-600 rounded-full"></div>
                          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Aktivitas Akademik</h3>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pendidikan Formal</label>
                          <select
                            value={form.pendidikanFormalLembagaId || ''}
                            onChange={(e) => {
                              const lemId = e.target.value;
                              setForm(prev => ({
                                ...prev,
                                pendidikanFormalLembagaId: lemId,
                                pendidikanFormalClassId: 'calon'
                              }));
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm focus:border-emerald-500 outline-none"
                          >
                            <option value="">Tidak Ada / Pilih Lembaga Formal...</option>
                            {lembagasList
                              .filter(l => getLembagaJenis(l) === 'Formal' && (form.gender ? (!l.gender || l.gender === form.gender || (l.gender as string) === 'Campuran' || (l.gender as string) === 'Semua') : true))
                              .map(l => (
                                <option key={l.id} value={l.id}>
                                  {l.nama}
                                </option>
                              ))
                            }
                          </select>
                        </div>

                        {/* Kotak Pilih Kelas Formal (Muncul saat Lembaga Formal dipilih) */}
                        {form.pendidikanFormalLembagaId && (
                          <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-slate-700 uppercase">
                                Pilih Kelas ({lembagasList.find(l => String(l.id) === String(form.pendidikanFormalLembagaId))?.nama || 'Formal'})
                              </label>
                            </div>

                            <select
                              value={form.statusEmis === 'Terdaftar' ? (form.pendidikanFormalClassId || 'calon') : 'calon'}
                              onChange={(e) => {
                                if (form.statusEmis !== 'Terdaftar') {
                                  setForm(prev => ({ ...prev, pendidikanFormalClassId: 'calon' }));
                                  return;
                                }
                                setForm(prev => ({ ...prev, pendidikanFormalClassId: e.target.value }));
                              }}
                              className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm focus:border-emerald-500 outline-none cursor-pointer"
                            >
                              <option value="calon">Calon Peserta Didik</option>
                              {kelasList
                                .filter(k => 
                                  getLemId(k) === String(form.pendidikanFormalLembagaId) &&
                                  k.nama.trim().toLowerCase() !== 'calon peserta didik' &&
                                  k.nama.trim().toLowerCase() !== 'calon pelajar'
                                )
                                .map(k => (
                                  <option 
                                    key={k.id} 
                                    value={k.id}
                                    disabled={form.statusEmis !== 'Terdaftar'}
                                  >
                                    {k.nama} {form.statusEmis !== 'Terdaftar' ? '(Perlu EMIS Terdaftar)' : ''}
                                  </option>
                                ))
                              }
                            </select>

                            {form.statusEmis !== 'Terdaftar' && (
                              <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/60 text-xs font-medium">
                                <span>⚠️</span>
                                <span>Status EMIS belum Terdaftar. Hanya kelas <strong>Calon Peserta Didik</strong> yang dapat dipilih.</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Pendidikan Internal Pondok yang Diikuti */}
                        <div className="pt-2 space-y-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase">Pendidikan Internal Pondok (Bisa Lebih Dari 1)</label>
                          <div className="space-y-2 max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                            {lembagasList.filter(l => getLembagaJenis(l) === 'Internal' && (form.gender ? (!l.gender || l.gender === form.gender || (l.gender as string) === 'Campuran' || (l.gender as string) === 'Semua') : true)).length === 0 ? (
                              <p className="text-xs text-slate-400 italic">Belum ada lembaga internal terdaftar.</p>
                            ) : (
                              lembagasList
                                .filter(l => getLembagaJenis(l) === 'Internal' && (form.gender ? (!l.gender || l.gender === form.gender || (l.gender as string) === 'Campuran' || (l.gender as string) === 'Semua') : true))
                                .map(l => {
                                  const selectedIds = form.pendidikanInternal ? form.pendidikanInternal.split(',').map(x => x.trim()).filter(Boolean) : [];
                                  const isChecked = selectedIds.includes(l.id);
                                  return (
                                    <label key={l.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          let nextIds = [...selectedIds];
                                          if (e.target.checked) {
                                            if (!nextIds.includes(l.id)) nextIds.push(l.id);
                                          } else {
                                            nextIds = nextIds.filter(id => id !== l.id);
                                          }
                                          setForm(prev => ({ ...prev, pendidikanInternal: nextIds.join(',') }));
                                        }}
                                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                      />
                                      <span>{l.nama}</span>
                                    </label>
                                  );
                                })
                            )}
                          </div>
                        </div>
                      </div>

                    <div className="border-t border-slate-100 pt-3">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catatan Tambahan</label>
                      <textarea
                        rows={3}
                        value={form.catatan}
                        onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                        placeholder="Keterangan dsb."
                        className="select-text w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-emerald-500 outline-none"
                      />
                      
                      {/* Suggestion tags */}
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "Kurang KK",
                            "Kurang KTP",
                            "Kurang ijazah",
                            "Kurang akta",
                            "Kurang pas foto",
                            "Belum dapat majmu'ah",
                            "Belum dapat tas"
                          ].map((sug) => (
                            <button
                              type="button"
                              key={sug}
                              onClick={() => {
                                const current = form.catatan.trim();
                                if (!current) {
                                  setForm({ ...form, catatan: sug });
                                } else {
                                  const parts = current.split(',').map(p => p.trim()).filter(Boolean);
                                  if (!parts.includes(sug)) {
                                    setForm({ ...form, catatan: [...parts, sug].join(', ') });
                                  }
                                }
                              }}
                              className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 rounded-full px-2.5 py-1 transition-all active:scale-95 border border-slate-200 cursor-pointer"
                            >
                              + {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* STEP 5: DOKUMEN PENDUKUNG */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {[
                        { key: 'fileKk', label: 'Kartu Keluarga (KK)', icon: FileText },
                        { key: 'fileKtp', label: 'KTP Orang Tua', icon: User },
                        { key: 'fileAkta', label: 'Akta Kelahiran', icon: FileText },
                        { key: 'fileIjazah', label: 'Ijazah Terakhir', icon: GraduationCap },
                      ].map((doc) => (
                        <div key={doc.key} className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center hover:border-emerald-500 transition-all flex flex-col justify-between">
                          <div>
                            <doc.icon className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-700">{doc.label}</p>
                          </div>
                          <div className="mt-2.5">
                            {form[doc.key as keyof typeof form] ? (
                              <div className="flex items-center justify-between gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-100">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <span className="truncate" title={fileNames[doc.key] || form[doc.key as keyof typeof form]}>
                                    {fileNames[doc.key] || 'Berkas Terunggah'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewFile({ name: doc.label, url: form[doc.key as keyof typeof form] })}
                                    className="text-slate-400 hover:text-emerald-600 p-1 rounded-md hover:bg-emerald-100/50 transition-colors cursor-pointer"
                                    title="Pratinjau Berkas"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setForm({ ...form, [doc.key]: '' });
                                      setFileNames(prev => ({ ...prev, [doc.key]: '' }));
                                    }}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Hapus Berkas"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                                {isCompressing[doc.key] ? (
                                  <>
                                    <div className="h-3 w-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                                    Memproses...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-3.5 w-3.5" />
                                    Pilih Berkas
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  className="hidden"
                                  disabled={isCompressing[doc.key]}
                                  onClick={(e) => {
                                    (e.target as HTMLInputElement).value = '';
                                  }}
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const file = e.target.files[0];
                                      setIsCompressing(prev => ({ ...prev, [doc.key]: true }));
                                      compressImageAndGetBase64(file)
                                        .then(async (base64) => {
                                          const publicUrl = await uploadFileToStorage(base64, file.name, doc.key);
                                          setForm(f => ({ ...f, [doc.key]: publicUrl }));
                                          setFileNames(prev => ({ ...prev, [doc.key]: file.name }));
                                        })
                                        .catch((err: any) => {
                                          console.error("Error compressing/uploading document:", err);
                                          alert("Gagal memproses berkas: " + err.message);
                                        })
                                        .finally(() => {
                                          setIsCompressing(prev => ({ ...prev, [doc.key]: false }));
                                        });
                                    }
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pas Foto Upload */}
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center mt-4">
                      <User className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800">Pas Foto Santri Resmi (3x4)</p>
                      <p className="text-[10px] text-slate-400 mt-1">Gunakan foto berlatar merah/biru ukuran maks 2MB</p>
                      
                      <div className="mt-3 flex justify-center">
                        {form.filePasFoto ? (
                          <div className="relative inline-block rounded-xl overflow-hidden border border-emerald-300 shadow-sm">
                            <img src={form.filePasFoto} className="h-28 w-22 object-cover" alt="Uploaded Pasfoto" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-slate-950/45 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewFile({ name: 'Pas Foto Santri', url: form.filePasFoto })}
                                className="bg-white text-slate-800 p-1.5 rounded-full hover:bg-white/90 hover:scale-105 transition-all cursor-pointer"
                                title="Pratinjau Pas Foto"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setForm({ ...form, filePasFoto: '' });
                                  setFileNames(prev => ({ ...prev, filePasFoto: '' }));
                                }}
                                className="bg-rose-600 text-white p-1.5 rounded-full hover:bg-rose-700 hover:scale-105 transition-all cursor-pointer"
                                title="Hapus Pas Foto"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
                            {isCompressing.filePasFoto ? (
                              <>
                                <div className="h-3 w-3 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mr-1"></div>
                                Memproses...
                              </>
                            ) : (
                              <>
                                <Upload className="h-3.5 w-3.5" />
                                Unggah Pas Foto
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={isCompressing.filePasFoto}
                              onClick={(e) => {
                                (e.target as HTMLInputElement).value = '';
                              }}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  setIsCompressing(prev => ({ ...prev, filePasFoto: true }));
                                  compressImageAndGetBase64(file, 240, 320, 0.7) // Standard Pas Foto 3x4 ratio in small dimensions
                                    .then(async (base64) => {
                                      const publicUrl = await uploadFileToStorage(base64, file.name, 'filePasFoto');
                                      setForm(f => ({ ...f, filePasFoto: publicUrl }));
                                      setFileNames(prev => ({ ...prev, filePasFoto: file.name }));
                                    })
                                    .catch((err: any) => {
                                      console.error("Error compressing/uploading pas foto:", err);
                                      alert("Gagal memproses pas foto: " + err.message);
                                    })
                                    .finally(() => {
                                      setIsCompressing(prev => ({ ...prev, filePasFoto: false }));
                                    });
                                }
                                e.target.value = '';
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Floating Footer Controls */}
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                
                {/* DESKTOP FOOTER */}
                <div className="hidden sm:flex items-center justify-between w-full">
                  {/* Left Side: Import & Bersihkan */}
                  <div className="flex items-center gap-3">
                    {!editingSantri && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsRealImportModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#0f8a3c] px-4.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Import Excel
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={!isAnyFieldFilled()}
                      onClick={() => {
                        setForm(initialFormState);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-500 transition-all active:scale-95 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Bersihkan
                    </button>
                  </div>

                  {/* Right Side: Batal/Sebelumnya & Selanjutnya/Simpan */}
                  <div className="flex items-center gap-3">
                    {currentStep === 1 ? (
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
                      >
                        Batal
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Sebelumnya
                      </button>
                    )}

                    {currentStep < 5 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="inline-flex items-center gap-1 rounded-full bg-[#0f8a3c] px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        Selanjutnya
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFormSubmit}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-900 transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <UserPlus className="h-4 w-4" />
                        Simpan
                      </button>
                    )}
                  </div>
                </div>

                {/* MOBILE FOOTER */}
                <div className="flex sm:hidden items-center justify-between w-full gap-2.5">
                  {!editingSantri && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsRealImportModalOpen(true);
                      }}
                      className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-full bg-emerald-50 text-[#0f8a3c] border border-emerald-100 active:scale-95 transition-all cursor-pointer"
                      title="Import Excel"
                    >
                      <Upload className="h-4.5 w-4.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={!isAnyFieldFilled()}
                    onClick={() => {
                      setForm(initialFormState);
                    }}
                    className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 disabled:opacity-45 disabled:pointer-events-none active:scale-95 transition-all border border-slate-200 cursor-pointer"
                    title="Bersihkan Semua Isian Form"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleFormSubmit}
                    className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-800 text-xs font-bold text-white hover:bg-emerald-900 shadow-md active:scale-95 transition-all cursor-pointer"
                    title="Simpan Data Santri"
                  >
                    <UserPlus className="h-4 w-4" />
                    Simpan
                  </button>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN FILE PREVIEW MODAL */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-250">
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/25 p-2 rounded-full transition-all cursor-pointer"
              title="Tutup"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="w-full max-w-3xl flex flex-col items-center">
              <p className="text-white font-bold text-lg mb-4 text-center tracking-wide">{previewFile.name}</p>
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-slate-900 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center shadow-2xl">
                {previewFile.url ? (
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="max-w-full max-h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = document.getElementById('preview-doc-fallback');
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div id="preview-doc-fallback" className="hidden flex flex-col items-center text-slate-400 p-8 text-center">
                  <FileText className="h-16 w-16 text-emerald-500 mb-3 animate-pulse" />
                  <p className="font-bold text-slate-200 text-sm">Pratinjau Dokumen {previewFile.name}</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">Dokumen berhasil diunggah dengan aman. Sistem verifikasi Sekretaris Pondok Pesantren telah memvalidasi berkas ini.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
