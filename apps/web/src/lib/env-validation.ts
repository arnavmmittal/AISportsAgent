/**
 * Environment Variable Validation
 *
 * CRITICAL SECURITY: App refuses to start if configuration is unsafe.
 * Validates all required secrets and prevents production misconfigurations.
 *
 * This runs at app startup and throws if any validation fails.
 */

import { z } from 'zod';

// Define environment schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']),

  // Database (REQUIRED)
  DATABASE_URL: z.string()
    .url('DATABASE_URL must be a valid URL')
    .startsWith('postgresql://', 'DATABASE_URL must be PostgreSQL connection string'),

  SUPABASE_URL: z.string()
    .url('SUPABASE_URL must be a valid URL')
    .optional(),

  SUPABASE_ANON_KEY: z.string()
    .min(100, 'SUPABASE_ANON_KEY appears invalid (too short)')
    .optional(),

  // Authentication (REQUIRED)
  NEXTAUTH_SECRET: z.string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters for security'),

  NEXTAUTH_URL: z.string()
    .url('NEXTAUTH_URL must be a valid URL'),

  // AI Services (REQUIRED)
  OPENAI_API_KEY: z.string()
    .startsWith('sk-', 'OPENAI_API_KEY must start with sk-'),

  OPENAI_MODEL: z.string()
    .default('gpt-4-turbo-preview'),

  // Encryption (REQUIRED for production)
  ENCRYPTION_KEY: z.string()
    .length(64, 'ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)')
    .regex(/^[a-fA-F0-9]{64}$/, 'ENCRYPTION_KEY must be valid hex')
    .optional(),

  // Feature Flags (CRITICAL SECURITY)
  ENABLE_DEMO_ACCOUNTS: z.enum(['true', 'false'])
    .default('false'),

  ENABLE_COST_LIMITS: z.enum(['true', 'false'])
    .default('true'),

  ENABLE_RATE_LIMITING: z.enum(['true', 'false'])
    .default('true'),

  // Cost Controls (REQUIRED for production)
  COST_LIMIT_DAILY: z.string()
    .optional()
    .transform(val => val ? parseFloat(val) : 500)
    .refine(val => val > 0 && val <= 10000, 'Daily cost limit must be between $0 and $10,000'),

  COST_LIMIT_MONTHLY: z.string()
    .optional()
    .transform(val => val ? parseFloat(val) : 10000)
    .refine(val => val > 0 && val <= 100000, 'Monthly cost limit must be between $0 and $100,000'),

  // Monitoring (optional but recommended)
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // Voice service (optional)
  VOICE_SERVICE_KEY: z.string().optional(),
});

/**
 * Production-specific validations
 * These are CRITICAL and will fail the app startup if violated
 */
function validateProductionConfig(env: z.infer<typeof envSchema>) {
  const errors: string[] = [];

  // CRITICAL: Demo accounts MUST be disabled in production
  if (env.ENABLE_DEMO_ACCOUNTS === 'true') {
    errors.push(
      '🚨 CRITICAL: Demo accounts are ENABLED in production! ' +
      'This is a severe security vulnerability. ' +
      'Set ENABLE_DEMO_ACCOUNTS=false immediately.'
    );
  }

  // CRITICAL: Cost limits MUST be enabled in production
  if (env.ENABLE_COST_LIMITS === 'false') {
    errors.push(
      '🚨 CRITICAL: Cost limits are DISABLED in production! ' +
      'This could result in runaway LLM costs. ' +
      'Set ENABLE_COST_LIMITS=true immediately.'
    );
  }

  // CRITICAL: Rate limiting MUST be enabled in production
  if (env.ENABLE_RATE_LIMITING === 'false') {
    errors.push(
      '🚨 CRITICAL: Rate limiting is DISABLED in production! ' +
      'This leaves the app vulnerable to DoS attacks. ' +
      'Set ENABLE_RATE_LIMITING=true immediately.'
    );
  }

  // CRITICAL: Encryption key MUST be set in production
  if (!env.ENCRYPTION_KEY) {
    errors.push(
      '🚨 CRITICAL: ENCRYPTION_KEY is not set in production! ' +
      'Sensitive data cannot be encrypted. ' +
      'Generate with: openssl rand -hex 32'
    );
  }

  // CRITICAL: Must use HTTPS in production
  if (!env.NEXTAUTH_URL.startsWith('https://')) {
    errors.push(
      '🚨 CRITICAL: NEXTAUTH_URL must use HTTPS in production! ' +
      'Current value uses HTTP, which is insecure. ' +
      'Update to https://...'
    );
  }

  // CRITICAL: Supabase must be configured
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    errors.push(
      '🚨 CRITICAL: Supabase is not configured in production! ' +
      'Database access will fail. ' +
      'Set SUPABASE_URL and SUPABASE_ANON_KEY.'
    );
  }

  // WARNING: Monitoring should be enabled
  if (!env.SENTRY_DSN) {
    console.warn(
      '⚠️  WARNING: Sentry is not configured in production. ' +
      'Errors will not be tracked. Consider setting SENTRY_DSN.'
    );
  }

  return errors;
}

/**
 * Development-specific validations
 */
function validateDevelopmentConfig(env: z.infer<typeof envSchema>) {
  const warnings: string[] = [];

  // Warn if using production-like URLs in development
  if (env.NEXTAUTH_URL.includes('flowsportscoach.com')) {
    warnings.push(
      '⚠️  WARNING: NEXTAUTH_URL appears to be a production URL in development environment. ' +
      'This may cause issues. Use http://localhost:3000 for local development.'
    );
  }

  // Warn if demo accounts disabled in development
  if (env.ENABLE_DEMO_ACCOUNTS === 'false') {
    warnings.push(
      '⚠️  INFO: Demo accounts are disabled in development. ' +
      'You may want to enable them for testing. Set ENABLE_DEMO_ACCOUNTS=true'
    );
  }

  return warnings;
}

/**
 * Validate environment variables
 * Called at app startup - throws if validation fails
 */
export function validateEnv(): z.infer<typeof envSchema> {
  console.log('🔍 Validating environment configuration...');

  // Parse environment variables
  let env: z.infer<typeof envSchema>;

  try {
    env = envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\n❌ Environment validation failed:\n');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\nPlease fix the above errors and restart the application.\n');
      throw new Error('Environment validation failed');
    }
    throw error;
  }

  // Environment-specific validations
  if (env.NODE_ENV === 'production') {
    const errors = validateProductionConfig(env);

    if (errors.length > 0) {
      console.error('\n🚨 PRODUCTION CONFIGURATION ERRORS:\n');
      errors.forEach(error => console.error(`  ${error}\n`));
      console.error('Application will NOT start until these critical issues are resolved.\n');
      throw new Error('Production configuration validation failed');
    }

    console.log('✅ Production environment validated successfully');
  } else if (env.NODE_ENV === 'development') {
    const warnings = validateDevelopmentConfig(env);

    warnings.forEach(warning => console.warn(`  ${warning}`));

    console.log('✅ Development environment validated');
  }

  // Log sanitized config (never log secrets!)
  console.log('\n📋 Environment Configuration:');
  console.log(`  - Environment: ${env.NODE_ENV}`);
  console.log(`  - Database: ${env.DATABASE_URL.split('@')[1] || 'configured'}`);
  console.log(`  - Auth URL: ${env.NEXTAUTH_URL}`);
  console.log(`  - OpenAI Model: ${env.OPENAI_MODEL}`);
  console.log(`  - Demo Accounts: ${env.ENABLE_DEMO_ACCOUNTS}`);
  console.log(`  - Cost Limits: ${env.ENABLE_COST_LIMITS}`);
  console.log(`  - Rate Limiting: ${env.ENABLE_RATE_LIMITING}`);
  console.log(`  - Encryption: ${env.ENCRYPTION_KEY ? 'Configured' : 'NOT CONFIGURED'}`);
  console.log(`  - Monitoring: ${env.SENTRY_DSN ? 'Enabled' : 'Disabled'}\n`);

  return env;
}

/**
 * Get validated environment (cached)
 */
let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv(): z.infer<typeof envSchema> {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * Type-safe environment access
 */
export type Env = z.infer<typeof envSchema>;
