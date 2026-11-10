import {
  LicenseRecord,
  DemoSettings,
  SystemStats,
  UserAccount,
  LicensePackageType,
  AuditLog
} from '../types';
import { getOwnerToken, setUserSession } from './authService';
import { OFFICIAL_SEED_LICENSES } from '../data/seedLicenses';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

/**
 * Validasi kode lisensi (Server API -> Firestore Cloud -> Official Seed Fallback)
 * Bekerja 100% mulus baik di AI Studio, Vercel Serverless, maupun Static Hosting.
 */
export async function validateLicenseCode(code: string): Promise<{
  valid: boolean;
  message?: string;
  license?: {
    id: string;
    code: string;
    packageName: string;
    packageType: LicensePackageType;
    durationDays: number;
    maxActivations: number;
    currentActivations: number;
    expiresAt: string | null;
  };
}> {
  const cleanCode = code.trim().toUpperCase();

  // 1. Coba hubungi API server terlebih dahulu (jika backend Express aktif)
  try {
    const res = await fetch('/api/license/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: cleanCode })
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && data.valid) {
        return data;
      }
    }
  } catch {
    // API backend tidak terjangkau (misalnya static deployment di Vercel/GitHub Pages)
  }

  // 2. Cek langsung ke Cloud Firestore (jika dideploy di Vercel tanpa Node backend)
  try {
    if (db) {
      const q = query(collection(db, 'licenses'), where('code', '==', cleanCode));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const licDoc = snap.docs[0].data() as any;
        if (licDoc.status === 'active') {
          return {
            valid: true,
            license: {
              id: snap.docs[0].id,
              code: licDoc.code,
              packageName: licDoc.packageName,
              packageType: licDoc.packageType,
              durationDays: licDoc.durationDays,
              maxActivations: licDoc.maxActivations || 100,
              currentActivations: licDoc.currentActivations || 0,
              expiresAt: licDoc.expiresAt || null
            }
          };
        } else {
          return { valid: false, message: `Status lisensi tidak aktif (${licDoc.status}).` };
        }
      }
    }
  } catch (err) {
    console.warn('[Firestore] Direct license check notice:', err);
  }

  // 3. Fallback ke Daftar Kode Resmi Seed Terintegrasi
  const matchedSeed = OFFICIAL_SEED_LICENSES.find(l => l.code === cleanCode);
  if (matchedSeed && matchedSeed.status === 'active') {
    return {
      valid: true,
      license: {
        id: matchedSeed.id,
        code: matchedSeed.code,
        packageName: matchedSeed.packageName,
        packageType: matchedSeed.packageType,
        durationDays: matchedSeed.durationDays,
        maxActivations: matchedSeed.maxActivations,
        currentActivations: matchedSeed.currentActivations,
        expiresAt: matchedSeed.expiresAt
      }
    };
  }

  return {
    valid: false,
    message: 'Kode lisensi tidak valid atau belum terdaftar. Pastikan kode diketik dengan huruf kapital sesuai format resmi.'
  };
}

/**
 * Aktivasi kode lisensi untuk guru (Server API -> Firestore Cloud -> Local Fallback)
 */
export async function activateLicense(payload: {
  code: string;
  name: string;
  email: string;
  schoolName: string;
}): Promise<{
  success: boolean;
  message?: string;
  user?: UserAccount;
}> {
  const cleanCode = payload.code.trim().toUpperCase();

  // 1. Coba aktivasi lewat Server API
  try {
    const res = await fetch('/api/license/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: cleanCode,
        name: payload.name.trim(),
        email: payload.email.trim(),
        schoolName: payload.schoolName.trim()
      })
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.success && data.user) {
        setUserSession(data.user);
        return data;
      }
    }
  } catch {
    // API backend tidak terjangkau (misal static deployment di Vercel)
  }

  // 2. Validasi & Aktivasi Mandiri (Vercel & Offline Standalone Fallback)
  const validation = await validateLicenseCode(cleanCode);
  if (!validation.valid || !validation.license) {
    return {
      success: false,
      message: validation.message || 'Kode lisensi tidak valid.'
    };
  }

  const lic = validation.license;
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const userEmail = payload.email.trim() || `guru_${Math.random().toString(36).substring(2, 6)}@sekolah.id`;

  let userExpiresAt: string | null = lic.expiresAt;
  if (lic.durationDays > 0) {
    userExpiresAt = new Date(Date.now() + lic.durationDays * 24 * 60 * 60 * 1000).toISOString();
  }

  const userAccount: UserAccount = {
    uid: userId,
    email: userEmail,
    displayName: payload.name.trim(),
    role: 'licensed',
    status: 'active',
    schoolName: payload.schoolName.trim() || 'SMP / MTs',
    licenseId: lic.id,
    licenseCode: lic.code,
    packageName: lic.packageName,
    packageType: lic.packageType,
    expiresAt: userExpiresAt,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    workspaceId: `workspace_${userId}`
  };

  // Simpan ke Firestore jika koneksi Cloud tersedia
  if (db) {
    try {
      await setDoc(doc(db, 'users', userId), userAccount, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Notice during offline/standalone activation:', err);
    }
  }

  setUserSession(userAccount);

  return {
    success: true,
    message: `Selamat datang, ${payload.name}! Lisensi '${lic.packageName}' berhasil diaktifkan.`,
    user: userAccount
  };
}

/**
 * Ambil daftar lisensi (Owner Only)
 */
export async function fetchLicenses(filter?: { search?: string; status?: string; packageType?: string }): Promise<{
  success: boolean;
  licenses: LicenseRecord[];
  message?: string;
}> {
  try {
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.status && filter.status !== 'all') params.append('status', filter.status);
    if (filter?.packageType && filter.packageType !== 'all') params.append('packageType', filter.packageType);

    const res = await fetch(`/api/license/list?${params.toString()}`, {
      headers: { 'x-owner-token': getOwnerToken() }
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, licenses: [], message: error.message };
  }
}

/**
 * Buat satu kode lisensi baru (Owner Only)
 */
export async function createLicense(payload: {
  code?: string;
  packageName: string;
  packageType: LicensePackageType;
  durationDays: number;
  maxActivations: number;
  internalNote?: string;
}): Promise<{ success: boolean; license?: LicenseRecord; message?: string }> {
  try {
    const res = await fetch('/api/license/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-owner-token': getOwnerToken()
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Buat banyak kode lisensi sekaligus (Bulk Create - Owner Only)
 */
export async function bulkCreateLicenses(payload: {
  count: number;
  packageName: string;
  packageType: LicensePackageType;
  durationDays: number;
  maxActivations: number;
  prefix?: string;
  internalNote?: string;
}): Promise<{ success: boolean; count?: number; licenses?: LicenseRecord[]; message?: string }> {
  try {
    const res = await fetch('/api/license/bulk-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-owner-token': getOwnerToken()
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Update status lisensi (Owner Only)
 */
export async function updateLicense(
  id: string,
  updates: Partial<LicenseRecord>
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`/api/license/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-owner-token': getOwnerToken()
      },
      body: JSON.stringify(updates)
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Cabut atau Hapus lisensi (Owner Only)
 */
export async function revokeLicense(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`/api/license/${id}/revoke`, {
      method: 'POST',
      headers: { 'x-owner-token': getOwnerToken() }
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Ambil Pengaturan Mode Demo
 */
export async function fetchDemoSettings(): Promise<DemoSettings> {
  const fallbackSettings: DemoSettings = {
    demoEnabled: true,
    allowedFeatures: [
      'generator_pg_preview',
      'generator_essay_preview',
      'curriculum_cp_tp_preview',
      'bloom_solo_preview',
      'cbt_simulation_preview'
    ],
    maxQuestionsPerGeneration: 5,
    maxGenerationsPerSession: 2,
    dailyLimit: 10,
    exportEnabled: false,
    persistenceEnabled: false,
    demoMessage: 'Selamat datang di PAIBP FASE D SMART LEARNING PRO 2026. Anda sedang mencoba Mode Demo dengan fitur terbatas (Maks 5 soal, 2x generasi). Aktifkan Lisensi Guru untuk menikmati akses penuh tanpa batas.',
    activateButtonText: 'Aktifkan Lisensi Penuh Sekarang'
  };

  try {
    const res = await fetch('/api/demo/settings');
    const data = await res.json();
    if (data.success && data.settings) {
      return data.settings;
    }
  } catch (e) {
    console.warn('Failed to fetch demo settings, using defaults:', e);
  }
  return fallbackSettings;
}

/**
 * Simpan Pengaturan Mode Demo (Owner Only)
 */
export async function updateDemoSettings(settings: Partial<DemoSettings>): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/demo/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-owner-token': getOwnerToken()
      },
      body: JSON.stringify(settings)
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Ambil statistik sistem (Owner Only)
 */
export async function fetchSystemStats(): Promise<{ success: boolean; stats: SystemStats }> {
  const fallbackStats: SystemStats = {
    totalUsers: 0,
    activeLicenses: 0,
    expiredLicenses: 0,
    revokedLicenses: 0,
    demoUsersCount: 0,
    totalGenerations: 0,
    activeToday: 0
  };

  try {
    const res = await fetch('/api/stats/summary', {
      headers: { 'x-owner-token': getOwnerToken() }
    });
    const data = await res.json();
    if (data.success && data.stats) {
      return { success: true, stats: data.stats };
    }
  } catch (e) {
    console.warn('Failed to fetch stats, using fallback:', e);
  }
  return { success: true, stats: fallbackStats };
}

/**
 * Ambil daftar pengguna terdaftar (Owner Only)
 */
export async function fetchUsersList(search?: string): Promise<{ success: boolean; users: UserAccount[] }> {
  try {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`/api/users/list${params}`, {
      headers: { 'x-owner-token': getOwnerToken() }
    });
    const data = await res.json();
    return { success: data.success, users: data.users || [] };
  } catch (e) {
    return { success: false, users: [] };
  }
}

/**
 * Update status user (Owner Only)
 */
export async function updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`/api/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-owner-token': getOwnerToken()
      },
      body: JSON.stringify({ status })
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Ambil log audit (Owner Only)
 */
export async function fetchAuditLogs(): Promise<{ success: boolean; logs: AuditLog[] }> {
  try {
    const res = await fetch('/api/audit-logs', {
      headers: { 'x-owner-token': getOwnerToken() }
    });
    const data = await res.json();
    return { success: data.success, logs: data.logs || [] };
  } catch (e) {
    return { success: false, logs: [] };
  }
}
