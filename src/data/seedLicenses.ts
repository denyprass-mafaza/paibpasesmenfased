import { LicenseRecord } from '../types';

/**
 * MASTER KODE LISENSI RESMI PAIBP FASE D (2026)
 * Tersinkronisasi secara universal untuk lingkungan AI Studio, GitHub, dan Vercel (Client-side & Server-side).
 */
export const OFFICIAL_SEED_LICENSES: LicenseRecord[] = [
  {
    id: 'lic-seed-001',
    code: 'PAI2026-GURU-INDV-7788',
    packageName: 'Lisensi Guru Individual (1 Tahun)',
    packageType: 'individual',
    status: 'active',
    maxActivations: 100,
    currentActivations: 0,
    activations: [],
    durationDays: 365,
    expiresAt: '2030-12-31T23:59:59.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'denyprass37@gmail.com',
    internalNote: 'Lisensi Guru Mandiri Fase D (Kelas 7, 8, 9)'
  },
  {
    id: 'lic-seed-002',
    code: 'PAI2026-SEKOLAH-SMP-9911',
    packageName: 'Lisensi Sekolah / Lembaga SMP (Multi Guru)',
    packageType: 'institution',
    status: 'active',
    maxActivations: 250,
    currentActivations: 0,
    activations: [],
    durationDays: 365,
    expiresAt: '2030-12-31T23:59:59.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'denyprass37@gmail.com',
    internalNote: 'Paket Kolektif MGMP / Sekolah SMP Fase D'
  },
  {
    id: 'lic-seed-003',
    code: 'PAI2026-PRO-LIFETIME-001',
    packageName: 'Lisensi Pro Lifetime PAI 2026',
    packageType: 'custom',
    status: 'active',
    maxActivations: 1000,
    currentActivations: 0,
    activations: [],
    durationDays: 0,
    expiresAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'denyprass37@gmail.com',
    internalNote: 'Lisensi Akses Penuh Selamanya (Lifetime)'
  },
  {
    id: 'lic-seed-004',
    code: 'PAI2026-TRIAL-30D-5522',
    packageName: 'Lisensi Uji Coba Guru (30 Hari)',
    packageType: 'period',
    status: 'active',
    maxActivations: 100,
    currentActivations: 0,
    activations: [],
    durationDays: 30,
    expiresAt: '2030-12-31T23:59:59.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'denyprass37@gmail.com',
    internalNote: 'Paket Evaluasi Pengawas / Guru 30 Hari'
  }
];
