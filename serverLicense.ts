import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  LicenseRecord,
  LicenseStatus,
  LicenseType,
  DemoSettings,
  OwnerContactInfo,
  FeatureFlagKey,
  FeatureAccess,
  QuotaToday,
  ActivationLogRecord,
  OwnerOverviewStats,
} from './src/types/license';
import { DEFAULT_LICENSES, verifyLicenseCodeLocally } from './src/data/defaultLicenses';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LICENSE_FILE = path.join(DATA_DIR, 'licenses.json');

export interface ServerLicenseDatabase {
  licenses: LicenseRecord[];
  ownerConfig: {
    authSecret: string; // Password for owner panel (default: 'PAIBPOwner2026!')
    contactInfo: OwnerContactInfo;
    demoSettings: DemoSettings;
    featureFlags: Record<FeatureFlagKey, FeatureAccess>;
  };
  dailyUsage: Record<string, QuotaToday>; // keyed by device_id
  activationLogs: ActivationLogRecord[];
  rateLimits: Record<string, { count: number; lastAttempt: number }>;
}

const DEFAULT_DEMO_SETTINGS: DemoSettings = {
  maxGeneratePerSession: 5,
  maxGeneratePerDay: 20,
  maxKisiKisiPerDay: 1,
  maxIndicatorsPerKisi: 10,
  maxPackagePerDay: 1,
  maxQuestionsPerPackage: 10,
  maxRubricPerDay: 1,
  maxStoredQuestionsInBank: 5,
  maxStoredPackages: 1,
  maxStudentsInAnalytics: 5,
  maxAnalyticsPerDay: 1,
  allowImportInDemo: false,
  watermarkText: 'DEMO – PAIBP SMART ASSESSMENT PRO',
};

const DEFAULT_CONTACT_INFO: OwnerContactInfo = {
  whatsapp: '6281234567890',
  email: 'owner@paibp-smartassessment.id',
  purchaseUrl: 'https://wa.me/6281234567890?text=Halo%20Owner%20PAIBP%20Smart%20Assessment%20Pro',
  supportUrl: 'https://wa.me/6281234567890?text=Bantuan%20Lisensi%20PAIBP',
  customNote: 'Hubungi Tim Pengembang Resmi PAIBP Smart Assessment Pro untuk aktivasi lisensi sekolah atau pribadi.',
};

const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, FeatureAccess> = {
  basic_generator: 'DEMO',
  advanced_generator: 'PRO',
  question_bank: 'DEMO',
  kisi_kisi: 'DEMO',
  rubric: 'DEMO',
  analytics: 'DEMO',
  remedial_ai: 'PRO',
  enrichment_ai: 'PRO',
  validator: 'DEMO',
  quran: 'DEMO',
  word_export: 'PRO',
  pdf_export: 'PRO',
  excel_export: 'PRO',
  csv_export: 'PRO',
  google_forms: 'PRO',
  batch_generate: 'PRO',
  import_bank: 'PRO',
};

function generateSecureCode(prefix = 'PAIBP-EF26'): string {
  // Format: PREFIX-XXXX-XXXX-XXXX using high entropy characters
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const getChunk = () => {
    let res = '';
    const bytes = crypto.randomBytes(4);
    for (let i = 0; i < 4; i++) {
      res += charset[bytes[i] % charset.length];
    }
    return res;
  };
  return `${prefix}-${getChunk()}-${getChunk()}-${getChunk()}`;
}

export function getInitialLicenseDatabase(): ServerLicenseDatabase {
  const now = new Date().toISOString();
  return {
    licenses: [...DEFAULT_LICENSES],
    ownerConfig: {
      authSecret: 'PAIBPOwner2026!',
      contactInfo: DEFAULT_CONTACT_INFO,
      demoSettings: DEFAULT_DEMO_SETTINGS,
      featureFlags: DEFAULT_FEATURE_FLAGS,
    },
    dailyUsage: {},
    activationLogs: [
      {
        id: 'LOG-INIT',
        license_code: 'SYSTEM_INIT',
        status: 'SUCCESS',
        device_id_masked: 'SYSTEM',
        timestamp: now,
        details: 'Sistem Lisensi & Owner Panel berhasil diinisialisasi',
      },
    ],
    rateLimits: {},
  };
}

export class ServerLicenseStore {
  private db: ServerLicenseDatabase;

  constructor() {
    this.db = this.load();
  }

  private load(): ServerLicenseDatabase {
    try {
      if (fs.existsSync(LICENSE_FILE)) {
        const raw = fs.readFileSync(LICENSE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        
        // Synchronize with DEFAULT_LICENSES to ensure all GitHub/Vercel licenses exist
        const existingCodes = new Set((parsed.licenses || []).map((l: any) => l.license_code?.toUpperCase()));
        const mergedLicenses = [...(parsed.licenses || [])];
        for (const def of DEFAULT_LICENSES) {
          if (!existingCodes.has(def.license_code.toUpperCase())) {
            mergedLicenses.unshift(def);
          }
        }

        return {
          licenses: mergedLicenses,
          ownerConfig: {
            authSecret: parsed.ownerConfig?.authSecret || 'PAIBPOwner2026!',
            contactInfo: { ...DEFAULT_CONTACT_INFO, ...(parsed.ownerConfig?.contactInfo || {}) },
            demoSettings: { ...DEFAULT_DEMO_SETTINGS, ...(parsed.ownerConfig?.demoSettings || {}) },
            featureFlags: { ...DEFAULT_FEATURE_FLAGS, ...(parsed.ownerConfig?.featureFlags || {}) },
          },
          dailyUsage: parsed.dailyUsage || {},
          activationLogs: parsed.activationLogs || [],
          rateLimits: parsed.rateLimits || {},
        };
      }
    } catch (e) {
      console.error('Failed to load licenses.json, using defaults:', e);
    }
    const initial = getInitialLicenseDatabase();
    this.saveDirect(initial);
    return initial;
  }

  private saveDirect(data: ServerLicenseDatabase) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LICENSE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  public save() {
    this.saveDirect(this.db);
  }

  // -------------------------
  // Server-Date Daily Usage
  // -------------------------
  public getServerDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  public getOrCreateDailyUsage(deviceId: string): QuotaToday {
    const today = this.getServerDate();
    const current = this.db.dailyUsage[deviceId];
    if (!current || current.date !== today) {
      const fresh: QuotaToday = {
        generateCount: 0,
        kisiKisiCount: 0,
        packageCount: 0,
        rubricCount: 0,
        analyticsCount: 0,
        date: today,
      };
      this.db.dailyUsage[deviceId] = fresh;
      this.save();
      return fresh;
    }
    return current;
  }

  public consumeQuota(
    deviceId: string,
    action: 'generate' | 'kisi' | 'package' | 'rubric' | 'analytics',
    amount = 1
  ): { allowed: boolean; remaining: number; message?: string } {
    const quota = this.getOrCreateDailyUsage(deviceId);
    const s = this.db.ownerConfig.demoSettings;

    if (action === 'generate') {
      if (amount > s.maxGeneratePerSession) {
        return {
          allowed: false,
          remaining: Math.max(0, s.maxGeneratePerDay - quota.generateCount),
          message: `Maksimal pembuatan soal mode DEMO adalah ${s.maxGeneratePerSession} butir per sesi.`,
        };
      }
      if (quota.generateCount + amount > s.maxGeneratePerDay) {
        return {
          allowed: false,
          remaining: Math.max(0, s.maxGeneratePerDay - quota.generateCount),
          message:
            'Batas penggunaan DEMO hari ini telah tercapai. Aktivasi PRO untuk membuka generator tanpa batas sesuai lisensi Anda.',
        };
      }
      quota.generateCount += amount;
      this.save();
      return { allowed: true, remaining: s.maxGeneratePerDay - quota.generateCount };
    }

    if (action === 'kisi') {
      if (quota.kisiKisiCount + amount > s.maxKisiKisiPerDay) {
        return {
          allowed: false,
          remaining: 0,
          message:
            'Batas pembuatan kisi-kisi mode DEMO (1 per hari) telah tercapai. Aktivasi PRO untuk membuat kisi-kisi tanpa batas.',
        };
      }
      quota.kisiKisiCount += amount;
      this.save();
      return { allowed: true, remaining: s.maxKisiKisiPerDay - quota.kisiKisiCount };
    }

    if (action === 'package') {
      if (quota.packageCount + amount > s.maxPackagePerDay) {
        return {
          allowed: false,
          remaining: 0,
          message:
            'Batas pembuatan paket asesmen mode DEMO (1 paket per hari) telah tercapai. Aktivasi PRO untuk akses tanpa batas.',
        };
      }
      quota.packageCount += amount;
      this.save();
      return { allowed: true, remaining: s.maxPackagePerDay - quota.packageCount };
    }

    if (action === 'rubric') {
      if (quota.rubricCount + amount > s.maxRubricPerDay) {
        return {
          allowed: false,
          remaining: 0,
          message:
            'Batas pembuatan rubrik mode DEMO (1 rubrik per hari) telah tercapai. Aktivasi PRO untuk akses tanpa batas.',
        };
      }
      quota.rubricCount += amount;
      this.save();
      return { allowed: true, remaining: s.maxRubricPerDay - quota.rubricCount };
    }

    if (action === 'analytics') {
      if (quota.analyticsCount + amount > s.maxAnalyticsPerDay) {
        return {
          allowed: false,
          remaining: 0,
          message:
            'Batas analisis hasil mode DEMO (1 kali per hari) telah tercapai. Aktivasi PRO untuk analisis tanpa batas.',
        };
      }
      quota.analyticsCount += amount;
      this.save();
      return { allowed: true, remaining: s.maxAnalyticsPerDay - quota.analyticsCount };
    }

    return { allowed: true, remaining: 999 };
  }

  // -------------------------
  // Anti-Brute Force Protection
  // -------------------------
  private checkRateLimit(key: string): boolean {
    const now = Date.now();
    const entry = this.db.rateLimits[key];
    if (entry) {
      // 10 minutes window
      if (now - entry.lastAttempt < 10 * 60 * 1000) {
        if (entry.count >= 6) {
          return false; // Rate limited
        }
      } else {
        // Reset window
        this.db.rateLimits[key] = { count: 0, lastAttempt: now };
      }
    }
    return true;
  }

  private recordFailedAttempt(key: string) {
    const now = Date.now();
    const entry = this.db.rateLimits[key] || { count: 0, lastAttempt: now };
    entry.count += 1;
    entry.lastAttempt = now;
    this.db.rateLimits[key] = entry;
    this.save();
  }

  private resetRateLimit(key: string) {
    delete this.db.rateLimits[key];
    this.save();
  }

  // -------------------------
  // License Validation & Activation
  // -------------------------
  public checkLicenseStatus(
    licenseCode?: string,
    deviceId?: string
  ): {
    status: 'DEMO' | 'PRO_ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';
    isPro: boolean;
    license: Partial<LicenseRecord> | null;
  } {
    if (!licenseCode) {
      return { status: 'DEMO', isPro: false, license: null };
    }

    const cleanCode = licenseCode.trim().toUpperCase();
    let license = this.db.licenses.find((l) => l.license_code.toUpperCase() === cleanCode);
    if (!license) {
      const localCheck = verifyLicenseCodeLocally(cleanCode, deviceId || '');
      if (localCheck.success && localCheck.license) {
        return {
          status: 'PRO_ACTIVE',
          isPro: true,
          license: localCheck.license,
        };
      }
      return { status: 'DEMO', isPro: false, license: null };
    }

    // Check device binding if deviceId provided
    if (deviceId && license.devices.length > 0) {
      const hasDevice = license.devices.some((d) => d.device_id === deviceId);
      if (!hasDevice) {
        // If device isn't registered yet but max_devices isn't exceeded, allow status check
        if (license.devices.length >= license.max_devices) {
          return { status: 'DEMO', isPro: false, license: null };
        }
      }
    }

    // Check Revoked / Suspended
    if (license.status === 'REVOKED') {
      return {
        status: 'REVOKED',
        isPro: false,
        license: {
          license_id: license.license_id,
          license_code: license.license_code,
          product_id: license.product_id,
          license_type: license.license_type,
          status: 'REVOKED',
        },
      };
    }
    if (license.status === 'SUSPENDED') {
      return {
        status: 'SUSPENDED',
        isPro: false,
        license: {
          license_id: license.license_id,
          license_code: license.license_code,
          product_id: license.product_id,
          license_type: license.license_type,
          status: 'SUSPENDED',
        },
      };
    }

    // Check Expiration
    if (license.expired_at) {
      const expDate = new Date(license.expired_at);
      if (expDate.getTime() < Date.now()) {
        license.status = 'EXPIRED';
        this.save();
        return {
          status: 'EXPIRED',
          isPro: false,
          license: {
            license_id: license.license_id,
            license_code: license.license_code,
            product_id: license.product_id,
            license_type: license.license_type,
            status: 'EXPIRED',
            expired_at: license.expired_at,
          },
        };
      }
    }

    // PRO Active
    return {
      status: 'PRO_ACTIVE',
      isPro: true,
      license: {
        license_id: license.license_id,
        license_code: license.license_code,
        product_id: license.product_id,
        license_type: license.license_type,
        status: license.status,
        activated_at: license.activated_at,
        expired_at: license.expired_at,
        max_devices: license.max_devices,
        activation_count: license.activation_count,
        customer_label: license.customer_label,
      },
    };
  }

  public activateLicense(
    inputCode: string,
    deviceId: string,
    ip = '127.0.0.1'
  ): {
    success: boolean;
    message: string;
    license?: any;
    errorType?: 'INVALID' | 'EXPIRED' | 'REVOKED' | 'LIMIT' | 'DEVICE_LIMIT' | 'RATE_LIMIT';
  } {
    const rateLimitKey = `${ip}_${deviceId}`;
    if (!this.checkRateLimit(rateLimitKey)) {
      return {
        success: false,
        message: 'Terlalu banyak percobaan aktivasi yang gagal. Silakan tunggu 10 menit sebelum mencoba kembali.',
        errorType: 'RATE_LIMIT',
      };
    }

    const cleanCode = (inputCode || '').trim().toUpperCase();
    const maskedDevice = deviceId.length > 8 ? `${deviceId.slice(0, 4)}...${deviceId.slice(-4)}` : deviceId;

    // Validate code pattern format
    if (!cleanCode || cleanCode.length < 8) {
      this.recordFailedAttempt(rateLimitKey);
      this.logActivation(cleanCode, 'FAILED', maskedDevice, ip, 'Format kode tidak valid');
      return {
        success: false,
        message: 'Kode aktivasi tidak valid. Periksa kembali kode yang Anda masukkan atau hubungi OWNER untuk mendapatkan bantuan.',
        errorType: 'INVALID',
      };
    }

    let license = this.db.licenses.find((l) => l.license_code.toUpperCase() === cleanCode);
    if (!license) {
      const localCheck = verifyLicenseCodeLocally(cleanCode, deviceId);
      if (localCheck.success && localCheck.license) {
        const foundDef = DEFAULT_LICENSES.find(d => d.license_code.toUpperCase() === cleanCode);
        const newLicense: LicenseRecord = {
          license_id: foundDef?.license_id || localCheck.license.license_id || `LIC-${cleanCode.slice(-8)}`,
          license_code: cleanCode,
          product_id: 'PAIBP-EF-2026',
          license_type: foundDef?.license_type || localCheck.license.license_type || 'LIFETIME',
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
          activated_at: new Date().toISOString(),
          expired_at: foundDef?.expired_at || localCheck.license.expired_at || null,
          activation_limit: foundDef?.activation_limit || 10,
          activation_count: 1,
          max_devices: foundDef?.max_devices || 10,
          customer_label: foundDef?.customer_label || localCheck.license.customer_label || 'Customer',
          notes: foundDef?.notes || 'Sinkronisasi Lisensi Resmi GitHub & Vercel',
          devices: [{ device_id: deviceId, activated_at: new Date().toISOString(), last_used_at: new Date().toISOString() }],
          created_by: 'SYSTEM_OWNER',
        };
        this.db.licenses.push(newLicense);
        this.save();
        this.logActivation(cleanCode, 'SUCCESS', maskedDevice, ip, `Aktivasi lisensi resmi (${newLicense.license_type})`);
        return {
          success: true,
          message: '🎉 Aktivasi berhasil! PAIBP SMART ASSESSMENT PRO sekarang aktif dalam MODE PRO.',
          license: {
            license_id: newLicense.license_id,
            license_code: newLicense.license_code,
            product_id: newLicense.product_id,
            license_type: newLicense.license_type,
            status: 'ACTIVE',
            activated_at: newLicense.activated_at,
            expired_at: newLicense.expired_at,
            max_devices: newLicense.max_devices,
            device_count: newLicense.devices.length,
            customer_label: newLicense.customer_label,
          },
        };
      }

      this.recordFailedAttempt(rateLimitKey);
      this.logActivation(cleanCode, 'FAILED', maskedDevice, ip, 'Kode tidak ditemukan di database');
      return {
        success: false,
        message: 'Kode aktivasi tidak valid. Periksa kembali kode yang Anda masukkan atau hubungi OWNER untuk mendapatkan bantuan.',
        errorType: 'INVALID',
      };
    }

    const now = new Date().toISOString();

    // Check Revoked (Requirement 15)
    if (license.status === 'REVOKED') {
      this.logActivation(cleanCode, 'REVOKED', maskedDevice, ip, 'Mencoba mengaktifkan kode revoked');
      return {
        success: false,
        message: 'Lisensi ini sudah tidak aktif. Silakan hubungi OWNER untuk informasi lebih lanjut.',
        errorType: 'REVOKED',
      };
    }

    // Check Suspended
    if (license.status === 'SUSPENDED') {
      this.logActivation(cleanCode, 'FAILED', maskedDevice, ip, 'Mencoba mengaktifkan kode suspended');
      return {
        success: false,
        message: 'Lisensi ini sedang ditangguhkan. Silakan hubungi OWNER untuk informasi lebih lanjut.',
        errorType: 'INVALID',
      };
    }

    // Check Expiry (Requirement 14)
    if (license.expired_at && new Date(license.expired_at).getTime() < Date.now()) {
      license.status = 'EXPIRED';
      this.save();
      this.logActivation(cleanCode, 'EXPIRED', maskedDevice, ip, 'Mencoba mengaktifkan lisensi expired');
      return {
        success: false,
        message: 'Lisensi Anda telah berakhir. Data Anda tetap aman, tetapi fitur PRO saat ini dikunci. Silakan perpanjang atau gunakan kode aktivasi baru.',
        errorType: 'EXPIRED',
      };
    }

    // Check Device & Activation Limits (Requirements 13 & 17)
    const existingDevice = license.devices.find((d) => d.device_id === deviceId);
    if (existingDevice) {
      // Re-activating on same registered device is allowed
      existingDevice.last_used_at = now;
      license.status = 'ACTIVE';
      if (!license.activated_at) license.activated_at = now;
      this.save();
      this.resetRateLimit(rateLimitKey);
      this.logActivation(cleanCode, 'SUCCESS', maskedDevice, ip, 'Aktivasi ulang pada perangkat terdaftar');
      return {
        success: true,
        message: '🎉 Aktivasi berhasil! PAIBP SMART ASSESSMENT PRO sekarang aktif dalam MODE PRO.',
        license: {
          license_id: license.license_id,
          license_code: license.license_code,
          product_id: license.product_id,
          license_type: license.license_type,
          status: license.status,
          activated_at: license.activated_at,
          expired_at: license.expired_at,
          max_devices: license.max_devices,
          device_count: license.devices.length,
          customer_label: license.customer_label,
        },
      };
    }

    // Check if max devices reached
    if (license.devices.length >= license.max_devices) {
      this.logActivation(cleanCode, 'DEVICE_LIMIT', maskedDevice, ip, `Batas perangkat tercapai (${license.max_devices})`);
      return {
        success: false,
        message: 'Kode aktivasi tersebut tidak dapat digunakan lagi. Kuota perangkat maksimal telah tercapai. Silakan gunakan kode lain atau hubungi OWNER.',
        errorType: 'DEVICE_LIMIT',
      };
    }

    // Check activation limit
    if (license.activation_count >= license.activation_limit) {
      this.logActivation(cleanCode, 'LIMIT_REACHED', maskedDevice, ip, `Batas aktivasi tercapai (${license.activation_limit})`);
      return {
        success: false,
        message: 'Kode aktivasi tersebut tidak dapat digunakan lagi. Silakan gunakan kode lain atau hubungi OWNER.',
        errorType: 'LIMIT',
      };
    }

    // If YEARLY and not yet activated, set expiry 365 days from now
    if (license.license_type === 'YEARLY' && !license.expired_at) {
      license.expired_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Register new device
    license.devices.push({
      device_id: deviceId,
      activated_at: now,
      last_used_at: now,
      label: `Perangkat #${license.devices.length + 1}`,
    });
    license.activation_count += 1;
    license.status = 'ACTIVE';
    license.activated_at = license.activated_at || now;

    this.save();
    this.resetRateLimit(rateLimitKey);
    this.logActivation(cleanCode, 'SUCCESS', maskedDevice, ip, `Aktivasi baru berhasil (Device ${license.devices.length}/${license.max_devices})`);

    return {
      success: true,
      message: '🎉 Aktivasi berhasil! PAIBP SMART ASSESSMENT PRO sekarang aktif dalam MODE PRO.',
      license: {
        license_id: license.license_id,
        license_code: license.license_code,
        product_id: license.product_id,
        license_type: license.license_type,
        status: license.status,
        activated_at: license.activated_at,
        expired_at: license.expired_at,
        max_devices: license.max_devices,
        device_count: license.devices.length,
        customer_label: license.customer_label,
      },
    };
  }

  private logActivation(
    license_code: string,
    status: ActivationLogRecord['status'],
    device_id_masked: string,
    ip: string,
    details: string
  ) {
    this.db.activationLogs.unshift({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      license_code,
      status,
      device_id_masked,
      timestamp: new Date().toISOString(),
      ip,
      details,
    });
    if (this.db.activationLogs.length > 500) {
      this.db.activationLogs = this.db.activationLogs.slice(0, 500);
    }
    this.save();
  }

  // -------------------------
  // Owner Management
  // -------------------------
  public verifyOwnerPassword(password: string): boolean {
    return password === this.db.ownerConfig.authSecret;
  }

  public getOwnerOverview(): OwnerOverviewStats {
    const totalLicenses = this.db.licenses.length;
    let activeLicenses = 0;
    let unusedLicenses = 0;
    let expiredLicenses = 0;
    let revokedLicenses = 0;
    let totalActivations = 0;
    let devicesRegistered = 0;

    const todayDate = this.getServerDate();
    let activationsToday = 0;

    for (const lic of this.db.licenses) {
      if (lic.status === 'ACTIVE') activeLicenses++;
      else if (lic.status === 'UNUSED') unusedLicenses++;
      else if (lic.status === 'EXPIRED') expiredLicenses++;
      else if (lic.status === 'REVOKED') revokedLicenses++;

      totalActivations += lic.activation_count;
      devicesRegistered += lic.devices.length;
    }

    for (const log of this.db.activationLogs) {
      if (log.status === 'SUCCESS' && log.timestamp.startsWith(todayDate)) {
        activationsToday++;
      }
    }

    return {
      totalLicenses,
      activeLicenses,
      unusedLicenses,
      expiredLicenses,
      revokedLicenses,
      activationsToday,
      totalActivations,
      devicesRegistered,
    };
  }

  public listLicenses(filter?: { status?: string; type?: string; search?: string }): LicenseRecord[] {
    let result = [...this.db.licenses];

    if (filter?.status && filter.status !== 'ALL') {
      result = result.filter((l) => l.status === filter.status);
    }
    if (filter?.type && filter.type !== 'ALL') {
      result = result.filter((l) => l.license_type === filter.type);
    }
    if (filter?.search) {
      const s = filter.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.license_code.toLowerCase().includes(s) ||
          l.customer_label.toLowerCase().includes(s) ||
          l.notes.toLowerCase().includes(s)
      );
    }

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public generateSingleLicense(params: {
    product_id?: string;
    license_type: LicenseType;
    duration_days?: number;
    start_date?: string;
    end_date?: string;
    activation_limit?: number;
    max_devices?: number;
    customer_label?: string;
    notes?: string;
    created_by?: string;
  }): LicenseRecord {
    const now = new Date().toISOString();
    const code = generateSecureCode();

    let expired_at: string | null = null;
    if (params.license_type === 'YEARLY') {
      expired_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    } else if (params.license_type === 'TRIAL') {
      const days = params.duration_days || 14;
      expired_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    } else if (params.license_type === 'CUSTOM' && params.end_date) {
      expired_at = new Date(params.end_date).toISOString();
    }

    const newLicense: LicenseRecord = {
      license_id: `LIC-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      license_code: code,
      product_id: params.product_id || 'PAIBP-EF-2026',
      status: 'UNUSED',
      license_type: params.license_type,
      created_at: now,
      activated_at: null,
      expired_at,
      activation_limit: params.activation_limit || 1,
      activation_count: 0,
      max_devices: params.max_devices || 1,
      devices: [],
      customer_label: params.customer_label || 'Lisensi Resmi PAIBP 2026',
      notes: params.notes || '',
      created_by: params.created_by || 'OWNER',
    };

    this.db.licenses.unshift(newLicense);
    this.save();
    return newLicense;
  }

  public bulkGenerateLicenses(params: {
    count: number;
    license_type: LicenseType;
    duration_days?: number;
    activation_limit?: number;
    max_devices?: number;
    customer_label_prefix?: string;
    notes?: string;
  }): LicenseRecord[] {
    const generated: LicenseRecord[] = [];
    const count = Math.min(Math.max(1, params.count), 500); // safety clamp
    const now = new Date().toISOString();

    let expired_at: string | null = null;
    if (params.license_type === 'YEARLY') {
      expired_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    } else if (params.license_type === 'TRIAL') {
      const days = params.duration_days || 14;
      expired_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    for (let i = 1; i <= count; i++) {
      let code = generateSecureCode();
      // Ensure uniqueness
      while (
        this.db.licenses.some((l) => l.license_code === code) ||
        generated.some((g) => g.license_code === code)
      ) {
        code = generateSecureCode();
      }

      const lic: LicenseRecord = {
        license_id: `LIC-BLK-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
        license_code: code,
        product_id: 'PAIBP-EF-2026',
        status: 'UNUSED',
        license_type: params.license_type,
        created_at: now,
        activated_at: null,
        expired_at,
        activation_limit: params.activation_limit || 1,
        activation_count: 0,
        max_devices: params.max_devices || 1,
        devices: [],
        customer_label: `${params.customer_label_prefix || 'Batch Lisensi'} #${i}`,
        notes: params.notes || `Generated in bulk batch of ${count}`,
        created_by: 'OWNER_BULK',
      };
      generated.push(lic);
    }

    this.db.licenses.unshift(...generated);
    this.save();
    return generated;
  }

  public updateLicense(
    licenseId: string,
    action: 'revoke' | 'suspend' | 'activate' | 'reset_devices' | 'reset_activation' | 'change_expiry' | 'edit_notes',
    payload?: any
  ): { success: boolean; message: string; license?: LicenseRecord } {
    const license = this.db.licenses.find((l) => l.license_id === licenseId);
    if (!license) {
      return { success: false, message: 'Lisensi tidak ditemukan' };
    }

    if (action === 'revoke') {
      license.status = 'REVOKED';
      this.save();
      return { success: true, message: 'Lisensi berhasil di-revoke (dicabut)', license };
    }

    if (action === 'suspend') {
      license.status = 'SUSPENDED';
      this.save();
      return { success: true, message: 'Lisensi ditangguhkan (suspend)', license };
    }

    if (action === 'activate') {
      license.status = 'ACTIVE';
      this.save();
      return { success: true, message: 'Status lisensi diubah menjadi AKTIF', license };
    }

    if (action === 'reset_devices') {
      // Requirement 22: RESET DEVICE ACTIVATION
      const prevCount = license.devices.length;
      license.devices = [];
      license.activation_count = 0;
      if (license.status === 'ACTIVE' && prevCount > 0) {
        license.status = 'UNUSED';
      }
      this.save();
      return {
        success: true,
        message: `Device binding berhasil di-reset (${prevCount} perangkat dihapus). Pelanggan dapat aktivasi ulang.`,
        license,
      };
    }

    if (action === 'reset_activation') {
      license.activation_count = 0;
      license.devices = [];
      license.status = 'UNUSED';
      this.save();
      return { success: true, message: 'Hitungan aktivasi berhasil di-reset ke 0', license };
    }

    if (action === 'change_expiry') {
      license.expired_at = payload.expired_at || null;
      if (license.expired_at && new Date(license.expired_at).getTime() < Date.now()) {
        license.status = 'EXPIRED';
      } else if (license.status === 'EXPIRED') {
        license.status = license.devices.length > 0 ? 'ACTIVE' : 'UNUSED';
      }
      this.save();
      return { success: true, message: 'Masa berlaku lisensi berhasil diperbarui', license };
    }

    if (action === 'edit_notes') {
      if (payload.notes !== undefined) license.notes = payload.notes;
      if (payload.customer_label !== undefined) license.customer_label = payload.customer_label;
      if (payload.max_devices !== undefined) license.max_devices = payload.max_devices;
      this.save();
      return { success: true, message: 'Informasi lisensi berhasil diperbarui', license };
    }

    return { success: false, message: 'Aksi tidak valid' };
  }

  public getLogs(): ActivationLogRecord[] {
    return this.db.activationLogs;
  }

  public getSettings() {
    return {
      contactInfo: this.db.ownerConfig.contactInfo,
      demoSettings: this.db.ownerConfig.demoSettings,
      featureFlags: this.db.ownerConfig.featureFlags,
    };
  }

  public updateSettings(settings: {
    contactInfo?: Partial<OwnerContactInfo>;
    demoSettings?: Partial<DemoSettings>;
    featureFlags?: Partial<Record<FeatureFlagKey, FeatureAccess>>;
    newOwnerPassword?: string;
  }) {
    if (settings.contactInfo) {
      this.db.ownerConfig.contactInfo = {
        ...this.db.ownerConfig.contactInfo,
        ...settings.contactInfo,
      };
    }
    if (settings.demoSettings) {
      this.db.ownerConfig.demoSettings = {
        ...this.db.ownerConfig.demoSettings,
        ...settings.demoSettings,
      };
    }
    if (settings.featureFlags) {
      this.db.ownerConfig.featureFlags = {
        ...this.db.ownerConfig.featureFlags,
        ...settings.featureFlags,
      };
    }
    if (settings.newOwnerPassword && settings.newOwnerPassword.length >= 6) {
      this.db.ownerConfig.authSecret = settings.newOwnerPassword;
    }
    this.save();
  }
}

export const serverLicenseStore = new ServerLicenseStore();
