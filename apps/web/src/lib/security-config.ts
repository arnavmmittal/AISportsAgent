/**
 * Security Configuration
 *
 * Centralized security settings for Flow Sports Coach.
 * These settings control rate limiting, cost controls, and other security features.
 *
 * IMPORTANT: Different settings for staging vs production
 */

// Environment detection
const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production';
const isStaging = process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'staging';
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMITS = {
  // Per-user limits (requests per minute)
  perUser: {
    ATHLETE: isProduction ? 60 : 120,   // Stricter in production
    COACH: isProduction ? 300 : 600,
    ADMIN: isProduction ? 600 : 1200,
  },
  // Per-school/tenant limits
  perTenant: isProduction ? 1000 : 2000,
  // Global limits (all users combined)
  global: isProduction ? 10000 : 50000,
  // Window duration
  windowSeconds: 60,
};

/**
 * Cost Control Configuration
 */
export const COST_LIMITS = {
  // Daily limits (USD)
  dailyPerSchool: parseFloat(process.env.COST_LIMIT_DAILY || (isProduction ? '500' : '100')),
  // Monthly limits (USD)
  monthlyTotal: parseFloat(process.env.COST_LIMIT_MONTHLY || (isProduction ? '10000' : '500')),
  // Circuit breaker threshold (triggers immediate halt)
  circuitBreakerThreshold: parseFloat(process.env.COST_CIRCUIT_BREAKER || (isProduction ? '500' : '50')),
  // Warning threshold (% of limit)
  warningThreshold: 0.8,
  // Token limits per user per day
  tokensPerUserDaily: isProduction ? 50000 : 100000,
  // Messages per user per day
  messagesPerUserDaily: isProduction ? 100 : 500,
};

/**
 * Session and Authentication Configuration
 */
export const AUTH_CONFIG = {
  // Session timeout (milliseconds)
  sessionTimeout: isProduction ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 1 day prod, 7 days dev
  // Maximum failed login attempts before lockout
  maxFailedAttempts: 5,
  // Lockout duration (milliseconds)
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  // Password minimum length
  minPasswordLength: 8,
  // Require email verification
  requireEmailVerification: isProduction,
};

/**
 * Data Retention Configuration
 */
export const RETENTION_CONFIG = {
  // Audit log retention (days)
  auditLogRetentionDays: 2555, // ~7 years for HIPAA compliance
  // Chat summary expiration (days)
  chatSummaryExpirationDays: 365,
  // Error log retention (days)
  errorLogRetentionDays: 90,
  // Token usage log retention (days)
  tokenUsageRetentionDays: 365,
};

/**
 * Crisis Detection Configuration
 */
export const CRISIS_CONFIG = {
  // Enable crisis detection
  enabled: true,
  // Auto-escalation timeout (minutes)
  autoEscalationMinutes: isProduction ? 5 : 30,
  // Severity thresholds
  severityThresholds: {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  },
  // Default escalation contacts (should be configured per-school in production)
  defaultEscalationEmail: process.env.CRISIS_EMERGENCY_EMAIL || 'crisis@flowsportscoach.com',
  // Enable SMS escalation (requires Twilio)
  enableSmsEscalation: isProduction && !!process.env.TWILIO_ACCOUNT_SID,
};

/**
 * Feature Flags
 */
export const FEATURE_FLAGS = {
  // Demo accounts (NEVER enable in production)
  enableDemoAccounts: process.env.ENABLE_DEMO_ACCOUNTS === 'true' && !isProduction,
  // Debug routes
  enableDebugRoutes: process.env.ENABLE_DEBUG_ROUTES === 'true' && !isProduction,
  // Cost limits enforcement
  enableCostLimits: process.env.ENABLE_COST_LIMITS !== 'false',
  // Rate limiting
  enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
  // Encryption for sensitive data
  enableEncryption: !!process.env.SUMMARY_ENCRYPTION_KEY,
  // Wearable integrations
  enableWearables: !!process.env.WHOOP_CLIENT_ID || !!process.env.GARMIN_CLIENT_ID,
  // AI predictions
  enablePredictions: true,
  // Voice features
  enableVoice: !!process.env.ELEVENLABS_API_KEY,
};

/**
 * Security Headers Configuration
 */
export const SECURITY_HEADERS = {
  // Content Security Policy
  csp: isProduction
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.openai.com wss://*.supabase.co;"
    : "default-src 'self' 'unsafe-inline' 'unsafe-eval' *;",
  // Strict Transport Security
  hsts: 'max-age=31536000; includeSubDomains',
  // Frame options
  frameOptions: 'DENY',
  // Content type sniffing
  contentTypeOptions: 'nosniff',
  // XSS Protection
  xssProtection: '1; mode=block',
  // Referrer Policy
  referrerPolicy: 'strict-origin-when-cross-origin',
};

/**
 * Validation helper
 */
export function validateSecurityConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check critical environment variables
  if (isProduction) {
    if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
      errors.push('NEXTAUTH_SECRET must be at least 32 characters in production');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is required in production');
    }
    if (FEATURE_FLAGS.enableDemoAccounts) {
      errors.push('Demo accounts MUST be disabled in production');
    }
    if (FEATURE_FLAGS.enableDebugRoutes) {
      errors.push('Debug routes MUST be disabled in production');
    }
    if (!FEATURE_FLAGS.enableCostLimits) {
      errors.push('Cost limits MUST be enabled in production');
    }
    if (!process.env.CRISIS_EMERGENCY_EMAIL) {
      errors.push('CRISIS_EMERGENCY_EMAIL is required in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log security configuration on startup (non-sensitive values only)
 */
export function logSecurityConfig(): void {
  console.log('🔐 Security Configuration:');
  console.log('  Environment:', isProduction ? 'PRODUCTION' : isStaging ? 'STAGING' : 'DEVELOPMENT');
  console.log('  Rate Limiting:', FEATURE_FLAGS.enableRateLimiting ? 'ENABLED' : 'DISABLED');
  console.log('  Cost Limits:', FEATURE_FLAGS.enableCostLimits ? 'ENABLED' : 'DISABLED');
  console.log('  Demo Accounts:', FEATURE_FLAGS.enableDemoAccounts ? '⚠️ ENABLED' : 'DISABLED');
  console.log('  Debug Routes:', FEATURE_FLAGS.enableDebugRoutes ? '⚠️ ENABLED' : 'DISABLED');
  console.log('  Encryption:', FEATURE_FLAGS.enableEncryption ? 'ENABLED' : 'DISABLED');
  console.log('  Crisis Detection:', CRISIS_CONFIG.enabled ? 'ENABLED' : 'DISABLED');

  const validation = validateSecurityConfig();
  if (!validation.valid) {
    console.error('❌ Security Configuration Errors:');
    validation.errors.forEach((err) => console.error(`   - ${err}`));
    if (isProduction) {
      throw new Error('Invalid security configuration for production');
    }
  } else {
    console.log('✅ Security configuration validated');
  }
}

export default {
  RATE_LIMITS,
  COST_LIMITS,
  AUTH_CONFIG,
  RETENTION_CONFIG,
  CRISIS_CONFIG,
  FEATURE_FLAGS,
  SECURITY_HEADERS,
  validateSecurityConfig,
  logSecurityConfig,
  isProduction,
  isStaging,
  isDevelopment,
};
