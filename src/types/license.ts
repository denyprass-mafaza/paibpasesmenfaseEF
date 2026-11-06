export type LicenseStatus = 'ACTIVE' | 'UNUSED' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';

export type LicenseType = 'TRIAL' | 'LIFETIME' | 'YEARLY' | 'CUSTOM';

export type AppRole = 'DEMO_USER' | 'PRO_USER' | 'OWNER';

export interface LicenseDevice {
  device_id: string;
  activated_at: string;
  last_used_at: string;
  label?: string;
}

export interface LicenseRecord {
  license_id: string;
  license_code: string;
  product_id: string;
  status: LicenseStatus;
  license_type: LicenseType;
  created_at: string;
  activated_at: string | null;
  expired_at: string | null;
  activation_limit: number;
  activation_count: number;
  max_devices: number;
  devices: LicenseDevice[];
  customer_label: string;
  notes: string;
  created_by: string;
}

export interface DemoSettings {
  maxGeneratePerSession: number;
  maxGeneratePerDay: number;
  maxKisiKisiPerDay: number;
  maxIndicatorsPerKisi: number;
  maxPackagePerDay: number;
  maxQuestionsPerPackage: number;
  maxRubricPerDay: number;
  maxStoredQuestionsInBank: number;
  maxStoredPackages: number;
  maxStudentsInAnalytics: number;
  maxAnalyticsPerDay: number;
  allowImportInDemo: boolean;
  watermarkText: string;
}

export interface OwnerContactInfo {
  whatsapp: string;
  email: string;
  purchaseUrl: string;
  supportUrl: string;
  customNote: string;
}

export type FeatureFlagKey =
  | 'basic_generator'
  | 'advanced_generator'
  | 'question_bank'
  | 'kisi_kisi'
  | 'rubric'
  | 'analytics'
  | 'remedial_ai'
  | 'enrichment_ai'
  | 'validator'
  | 'quran'
  | 'word_export'
  | 'pdf_export'
  | 'excel_export'
  | 'csv_export'
  | 'google_forms'
  | 'batch_generate'
  | 'import_bank';

export type FeatureAccess = 'DEMO' | 'PRO' | 'DISABLED';

export interface QuotaToday {
  generateCount: number;
  kisiKisiCount: number;
  packageCount: number;
  rubricCount: number;
  analyticsCount: number;
  date: string;
}

export interface ClientLicenseState {
  role: AppRole;
  status: 'DEMO' | 'PRO_ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';
  isPro: boolean;
  licenseInfo: {
    license_id: string;
    license_code: string;
    product_id: string;
    license_type: LicenseType;
    status: LicenseStatus;
    activated_at: string | null;
    expired_at: string | null;
    max_devices: number;
    device_count: number;
    customer_label?: string;
  } | null;
  quotaToday: QuotaToday;
  demoSettings: DemoSettings;
  featureFlags: Record<FeatureFlagKey, FeatureAccess>;
  contactInfo: OwnerContactInfo;
  deviceId: string;
}

export interface ActivationLogRecord {
  id: string;
  license_code: string;
  status: 'SUCCESS' | 'FAILED' | 'REVOKED' | 'EXPIRED' | 'LIMIT_REACHED' | 'DEVICE_LIMIT';
  device_id_masked: string;
  timestamp: string;
  ip?: string;
  details: string;
}

export interface OwnerOverviewStats {
  totalLicenses: number;
  activeLicenses: number;
  unusedLicenses: number;
  expiredLicenses: number;
  revokedLicenses: number;
  activationsToday: number;
  totalActivations: number;
  devicesRegistered: number;
}
