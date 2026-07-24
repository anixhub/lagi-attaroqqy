import React from 'react';
import { Wallet, Clock, Lock, Sparkles, CheckCircle2, Search, Check, AlertCircle } from 'lucide-react';
import { BendaharaRecord } from '../types';

interface BendaharaViewProps {
  bendaharaList?: BendaharaRecord[];
  onToggleStatus?: (id: string) => void;
}

export default function BendaharaView({ bendaharaList = [], onToggleStatus }: BendaharaViewProps) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'semua' | 'Lunas' | 'Belum Lunas'>('semua');

  const filteredList = React.useMemo(() => {
    return bendaharaList.filter(item => {
      if (!item) return false;
      const matchSearch = (item.namaSantri || '').toLowerCase().includes(search.toLowerCase()) ||
                          (item.kamar || '').toLowerCase().includes(search.toLowerCase()) ||
                          (item.bulan || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'semua' || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bendaharaList, search, statusFilter]);

  const totalLunas = React.useMemo(() => (bendaharaList || []).filter(b => b && b.status === 'Lunas').reduce((sum, b) => sum + (b.nominal || 0), 0), [bendaharaList]);
  const totalBelumLunas = React.useMemo(() => (bendaharaList || []).filter(b => b && b.status === 'Belum Lunas').reduce((sum, b) => sum + (b.nominal || 0), 0), [bendaharaList]);

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Bendahara & Keuangan
          </h1>
          <p className="text-sm text-slate-500">
            Kelola syahriah bulanan, tabungan santri, dan laporan keuangan terpadu.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Lunas</p>
            <p className="text-2xl font-black text-emerald-900 mt-1">
              {totalLunas.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Tunggakan (Belum Lunas)</p>
            <p className="text-2xl font-black text-amber-900 mt-1">
              {totalBelumLunas.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Total Catatan</p>
            <p className="text-2xl font-black text-indigo-900 mt-1">{bendaharaList.length} Transaksi</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Wallet className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Syahriah Data Section */}
      {bendaharaList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari santri, kamar, bulan..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(['semua', 'Lunas', 'Belum Lunas'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'semua' ? 'Semua Status' : st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Santri</th>
                  <th className="py-3 px-4">Kamar</th>
                  <th className="py-3 px-4">Bulan Tagihan</th>
                  <th className="py-3 px-4">Nominal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{item.namaSantri}</td>
                    <td className="py-3 px-4 text-slate-600">{item.kamar}</td>
                    <td className="py-3 px-4 text-slate-600">{item.bulan}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {(item.nominal || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status === 'Lunas' ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {onToggleStatus && (
                        <button
                          onClick={() => onToggleStatus(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            item.status === 'Lunas'
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {item.status === 'Lunas' ? 'Tandai Belum Lunas' : 'Tandai Lunas'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada data tagihan yang sesuai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Status Container */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-amber-50/20 p-6 sm:p-8 shadow-sm">
        {/* Background decorative blob */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-amber-100/30 blur-3xl" />

        <div className="relative flex flex-col items-center text-center max-w-xl mx-auto space-y-5 py-6">
          {/* Animated Icon Circle */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
            <Wallet className="h-8 w-8" />
            <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 ring-2 ring-white">
              <Clock className="h-2.5 w-2.5 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              <Sparkles className="h-3.5 w-3.5" />
              Modul Keuangan Terpadu
            </span>
            <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl tracking-tight">
              Sistem Syahriah & Transaksi Terpadu
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Fitur keuangan syahriah bulanan, pencatatan donasi, integrasi gerbang pembayaran otomatis, 
              dan visualisasi grafik kas pesantren sedang dipersiapkan untuk mempermudah operasional bendahara.
            </p>
          </div>

          {/* Development Progress Indicator */}
          <div className="w-full max-w-sm space-y-2 pt-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>SINKRONISASI COLD-STORAGE</span>
              <span className="text-amber-700">75% SELESAI</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/50">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-500 animate-pulse" style={{ width: '75%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Planned Features List (Roadmap) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xs font-extrabold text-slate-800 uppercase tracking-wider">Syahriah Elektronik</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Penetapan tarif bulanan santri secara dinamis, laporan tunggakan otomatis, serta rekapitulasi data pembayaran digital.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            Dalam Antrean
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xs font-extrabold text-slate-800 uppercase tracking-wider">Notifikasi WhatsApp</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Kirim pengingat tagihan bulanan langsung ke WhatsApp wali santri hanya dengan satu klik konfirmasi.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
            Sedang Pengkodean
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xs font-extrabold text-slate-800 uppercase tracking-wider">Arus Kas Pesantren</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Modul pelaporan pemasukan dan pengeluaran operasional pondok yang transparan dan akuntabel.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Desain Siap
          </div>
        </div>
      </div>
    </div>
  );
}
