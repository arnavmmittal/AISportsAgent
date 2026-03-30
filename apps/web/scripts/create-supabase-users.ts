import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createSupabaseUsers() {
  console.log('🔐 Creating Supabase Auth users...');

  try {
    // Get all users from Prisma database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log(`Found ${users.length} users in database`);

    let created = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        // Determine password based on role
        const password = user.role === 'COACH' ? 'SeedPass_Coach!' : 'SeedPass_Athlete!';

        // Create user in Supabase Auth
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email!,
          password: password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: user.name,
            role: user.role,
            prisma_id: user.id,
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            console.log(`   ⏭️  Skipped ${user.email} (already exists)`);
            skipped++;
          } else {
            console.error(`   ❌ Error creating ${user.email}:`, error.message);
          }
        } else {
          console.log(`   ✓ Created ${user.email} (${user.role})`);
          created++;

          // Update Prisma user with Supabase ID
          await prisma.user.update({
            where: { id: user.id },
            data: { id: data.user.id }, // Use Supabase UUID as the user ID
          });
        }
      } catch (err) {
        console.error(`   ❌ Error processing ${user.email}:`, err);
      }
    }

    console.log(`\n✅ Summary:`);
    console.log(`   - Created: ${created} users`);
    console.log(`   - Skipped: ${skipped} users`);
    console.log(`   - Total: ${users.length} users`);

  } catch (error) {
    console.error('Failed to create Supabase users:', error);
    throw error;
  }
}

createSupabaseUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
