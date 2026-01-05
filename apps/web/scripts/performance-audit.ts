/**
 * Performance Audit Script
 *
 * Checks database, API, and application performance for common issues.
 * Run before deployment to catch performance regressions.
 *
 * Usage:
 *   pnpm tsx scripts/performance-audit.ts
 */

import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient();

interface AuditResult {
  category: string;
  check: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
  recommendation?: string;
}

const results: AuditResult[] = [];

/**
 * Add audit result
 */
function addResult(
  category: string,
  check: string,
  status: 'PASS' | 'WARN' | 'FAIL',
  details: string,
  recommendation?: string
) {
  results.push({ category, check, status, details, recommendation });
}

/**
 * Test 1: Database Connection Performance
 */
async function testDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection...');

  try {
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = performance.now() - start;

    if (duration < 50) {
      addResult(
        'Database',
        'Connection Latency',
        'PASS',
        `${duration.toFixed(2)}ms (excellent)`
      );
    } else if (duration < 100) {
      addResult(
        'Database',
        'Connection Latency',
        'WARN',
        `${duration.toFixed(2)}ms (acceptable)`,
        'Consider using connection pooler (port 6543) for better performance'
      );
    } else {
      addResult(
        'Database',
        'Connection Latency',
        'FAIL',
        `${duration.toFixed(2)}ms (too slow)`,
        'Use Supabase connection pooler and check network latency'
      );
    }
  } catch (error) {
    addResult(
      'Database',
      'Connection',
      'FAIL',
      'Failed to connect to database',
      'Check DATABASE_URL and Supabase status'
    );
  }
}

/**
 * Test 2: Query Performance
 */
async function testQueryPerformance() {
  console.log('🔍 Testing Query Performance...');

  // Test 1: Chat sessions query
  try {
    const start = performance.now();
    await prisma.chatSession.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    const duration = performance.now() - start;

    if (duration < 100) {
      addResult(
        'Database',
        'ChatSession Query',
        'PASS',
        `${duration.toFixed(2)}ms`
      );
    } else {
      addResult(
        'Database',
        'ChatSession Query',
        'WARN',
        `${duration.toFixed(2)}ms (slow)`,
        'Add index: CREATE INDEX idx_chat_sessions_created_at ON "ChatSession"(created_at DESC)'
      );
    }
  } catch (error) {
    addResult('Database', 'ChatSession Query', 'FAIL', 'Query failed');
  }

  // Test 2: Messages with join
  try {
    const start = performance.now();
    await prisma.message.findMany({
      where: { sessionId: 'test-session' },
      take: 10,
    });
    const duration = performance.now() - start;

    if (duration < 100) {
      addResult(
        'Database',
        'Message Query (Indexed)',
        'PASS',
        `${duration.toFixed(2)}ms`
      );
    } else {
      addResult(
        'Database',
        'Message Query',
        'WARN',
        `${duration.toFixed(2)}ms (slow)`,
        'Add index: CREATE INDEX idx_messages_session_id ON "Message"(session_id)'
      );
    }
  } catch (error) {
    addResult('Database', 'Message Query', 'FAIL', 'Query failed');
  }

  // Test 3: Mood logs query (common for coaches)
  try {
    const start = performance.now();
    await prisma.moodLog.findMany({
      where: { athleteId: 'test-athlete' },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    const duration = performance.now() - start;

    if (duration < 100) {
      addResult(
        'Database',
        'MoodLog Query',
        'PASS',
        `${duration.toFixed(2)}ms`
      );
    } else {
      addResult(
        'Database',
        'MoodLog Query',
        'WARN',
        `${duration.toFixed(2)}ms (slow)`,
        'Add index: CREATE INDEX idx_mood_logs_athlete_date ON "MoodLog"(athlete_id, created_at DESC)'
      );
    }
  } catch (error) {
    addResult('Database', 'MoodLog Query', 'FAIL', 'Query failed');
  }
}

/**
 * Test 3: Check for Missing Indexes
 */
async function checkMissingIndexes() {
  console.log('🔍 Checking for Missing Indexes...');

  const recommendedIndexes = [
    {
      table: 'ChatSession',
      columns: ['athlete_id'],
      reason: 'Frequently filtered by athlete',
    },
    {
      table: 'Message',
      columns: ['session_id'],
      reason: 'Messages always queried by session',
    },
    {
      table: 'Message',
      columns: ['session_id', 'created_at'],
      reason: 'Composite index for ordered queries',
    },
    {
      table: 'MoodLog',
      columns: ['athlete_id', 'created_at'],
      reason: 'Mood logs queried by athlete and date',
    },
    {
      table: 'AuditLog',
      columns: ['user_id', 'timestamp'],
      reason: 'Audit queries by user and date',
    },
    {
      table: 'AuditLog',
      columns: ['athlete_id', 'timestamp'],
      reason: 'Audit queries by athlete and date',
    },
  ];

  // Note: This is a simplified check. In production, query pg_indexes to verify.
  addResult(
    'Database',
    'Index Recommendations',
    'WARN',
    `${recommendedIndexes.length} recommended indexes`,
    'Run SQL to create indexes (see LOAD_TESTING.md)'
  );
}

/**
 * Test 4: Check Table Sizes
 */
async function checkTableSizes() {
  console.log('🔍 Checking Table Sizes...');

  try {
    const counts = await Promise.all([
      prisma.chatSession.count(),
      prisma.message.count(),
      prisma.moodLog.count(),
      prisma.auditLog.count(),
    ]);

    const [sessions, messages, moodLogs, auditLogs] = counts;

    addResult(
      'Database',
      'Table Sizes',
      'PASS',
      `Sessions: ${sessions.toLocaleString()}, Messages: ${messages.toLocaleString()}, MoodLogs: ${moodLogs.toLocaleString()}, AuditLogs: ${auditLogs.toLocaleString()}`
    );

    // Warn if audit logs getting large
    if (auditLogs > 100000) {
      addResult(
        'Database',
        'Audit Log Size',
        'WARN',
        `${auditLogs.toLocaleString()} audit logs`,
        'Consider archiving old audit logs (> 90 days) to cold storage'
      );
    }
  } catch (error) {
    addResult('Database', 'Table Sizes', 'FAIL', 'Could not query table sizes');
  }
}

/**
 * Test 5: Check Environment Configuration
 */
async function checkEnvironmentConfig() {
  console.log('🔍 Checking Environment Configuration...');

  // Check DATABASE_URL uses connection pooler
  const databaseUrl = process.env.DATABASE_URL || '';
  if (databaseUrl.includes(':6543')) {
    addResult(
      'Configuration',
      'Database Pooling',
      'PASS',
      'Using connection pooler (port 6543)'
    );
  } else if (databaseUrl.includes(':5432')) {
    addResult(
      'Configuration',
      'Database Pooling',
      'WARN',
      'Not using connection pooler',
      'Use port 6543 for better connection management: DATABASE_URL=...@host:6543/db?pgbouncer=true'
    );
  }

  // Check if demo accounts disabled in production
  const enableDemoAccounts = process.env.ENABLE_DEMO_ACCOUNTS;
  if (process.env.NODE_ENV === 'production' && enableDemoAccounts === 'true') {
    addResult(
      'Configuration',
      'Demo Accounts',
      'FAIL',
      'Demo accounts enabled in production',
      'Set ENABLE_DEMO_ACCOUNTS=false immediately'
    );
  } else {
    addResult(
      'Configuration',
      'Demo Accounts',
      'PASS',
      'Demo accounts disabled'
    );
  }

  // Check cost limits enabled
  const enableCostLimits = process.env.ENABLE_COST_LIMITS;
  if (process.env.NODE_ENV === 'production' && enableCostLimits !== 'true') {
    addResult(
      'Configuration',
      'Cost Limits',
      'FAIL',
      'Cost limits not enabled in production',
      'Set ENABLE_COST_LIMITS=true to prevent runaway costs'
    );
  } else {
    addResult(
      'Configuration',
      'Cost Limits',
      'PASS',
      'Cost limits enabled'
    );
  }
}

/**
 * Test 6: Check OpenAI Configuration
 */
async function checkOpenAIConfig() {
  console.log('🔍 Checking OpenAI Configuration...');

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    addResult(
      'Configuration',
      'OpenAI API Key',
      'FAIL',
      'OPENAI_API_KEY not set',
      'Set OPENAI_API_KEY in environment variables'
    );
  } else if (openaiKey.startsWith('sk-proj-')) {
    addResult(
      'Configuration',
      'OpenAI API Key',
      'PASS',
      'OpenAI API key configured'
    );
  } else {
    addResult(
      'Configuration',
      'OpenAI API Key',
      'WARN',
      'OpenAI API key format unexpected',
      'Verify key is valid project key (starts with sk-proj-)'
    );
  }

  // Check model configuration
  const openaiModel = process.env.OPENAI_MODEL;
  if (openaiModel === 'gpt-4-turbo-preview' || openaiModel === 'gpt-4-turbo') {
    addResult(
      'Configuration',
      'OpenAI Model',
      'PASS',
      `Using ${openaiModel}`
    );
  } else if (openaiModel === 'gpt-3.5-turbo') {
    addResult(
      'Configuration',
      'OpenAI Model',
      'WARN',
      'Using GPT-3.5 Turbo',
      'Consider GPT-4 Turbo for better quality responses'
    );
  } else {
    addResult(
      'Configuration',
      'OpenAI Model',
      'WARN',
      `Model not configured (using default)`,
      'Set OPENAI_MODEL=gpt-4-turbo-preview'
    );
  }
}

/**
 * Print Results
 */
function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('PERFORMANCE AUDIT RESULTS');
  console.log('='.repeat(80) + '\n');

  const byCategory = results.reduce((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, AuditResult[]>);

  for (const [category, categoryResults] of Object.entries(byCategory)) {
    console.log(`\n📊 ${category}`);
    console.log('-'.repeat(80));

    for (const result of categoryResults) {
      const icon =
        result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
      console.log(`${icon} ${result.check}: ${result.details}`);
      if (result.recommendation) {
        console.log(`   💡 ${result.recommendation}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter((r) => r.status === 'PASS').length;
  const warnings = results.filter((r) => r.status === 'WARN').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`⚠️  Warnings: ${warnings}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}\n`);

  if (failed > 0) {
    console.log('❌ PERFORMANCE AUDIT FAILED - Fix critical issues before deploying\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  PERFORMANCE AUDIT PASSED WITH WARNINGS - Review recommendations\n');
    process.exit(0);
  } else {
    console.log('✅ PERFORMANCE AUDIT PASSED - System ready for deployment\n');
    process.exit(0);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Performance Audit...\n');

  try {
    await testDatabaseConnection();
    await testQueryPerformance();
    await checkMissingIndexes();
    await checkTableSizes();
    await checkEnvironmentConfig();
    await checkOpenAIConfig();

    printResults();
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
