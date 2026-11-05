import {
  LicenseRecord,
  DemoSettings,
  SystemStats,
  UserAccount,
  LicensePackageType,
  AuditLog
} from '../types';
import { getOwnerToken, setUserSession } from './authService';

/**
 * Validasi kode lisensi di server tanpa mengaktifkannya
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
  try {
    const res = await fetch('/api/license/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim().toUpperCase() })
    });
    return await res.json();
  } catch (error: any) {
    return { valid: false, message: error.message || 'Gagal menghubungi server validasi lisensi' };
  }
}

/**
 * Aktivasi kode lisensi untuk guru
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
  try {
    const res = await fetch('/api/license/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: payload.code.trim().toUpperCase(),
        name: payload.name.trim(),
        email: payload.email.trim(),
        schoolName: payload.schoolName.trim()
      })
    });
    const data = await res.json();
    if (data.success && data.user) {
      setUserSession(data.user);
    }
    return data;
  } catch (error: any) {
    return { success: false, message: error.message || 'Gagal melakukan aktivasi lisensi' };
  }
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
