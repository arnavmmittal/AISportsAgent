# Encryption Key Rotation Guide

## Overview

This guide explains how to safely rotate encryption keys for field-level encrypted data in the AI Sports Agent platform.

**What's Encrypted:**
- `ChatSummary.summary` - Weekly summary text
- `ChatSummary.adherenceNotes` - Adherence notes
- `ChatSummary.keyThemes` - Array of themes
- `ChatSummary.recommendedActions` - Array of recommended actions

**Encryption Method:** AES-256-GCM (authenticated encryption)
**Key Format:** 32 bytes (64 hex characters)

---

## When to Rotate Keys

Rotate encryption keys in these scenarios:

1. **Scheduled Rotation (Every 90 Days)**
   - Recommended security best practice
   - Reduces risk if key is ever compromised

2. **Suspected Key Exposure**
   - Key appeared in logs or error messages
   - Key was committed to version control
   - Unauthorized person may have accessed key

3. **Security Incident**
   - Database breach
   - Server compromise
   - Ex-employee had access to keys

4. **Compliance Requirement**
   - University security policy mandates rotation
   - FERPA audit recommendation

---

## Key Rotation Strategy

**Important:** You CANNOT simply change the key - old data encrypted with the old key will become unreadable. You must **re-encrypt existing data**.

### Strategy A: Re-Encrypt in Place (Recommended)

**Best for:** Small to medium datasets (< 10,000 records)

**Steps:**

1. **Generate new key**
   ```bash
   # Generate new encryption key
   openssl rand -hex 32 > new_encryption_key.txt

   # Example output: a3f4b2c1d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2
   ```

2. **Add new key as secondary key**
   ```bash
   # In Vercel/Railway, add new environment variable
   SUMMARY_ENCRYPTION_KEY_NEW="<new-key-from-step-1>"

   # Keep old key temporarily
   SUMMARY_ENCRYPTION_KEY="<current-old-key>"
   ```

3. **Deploy re-encryption script**

   Create `/scripts/rotate-encryption-key.ts`:

   ```typescript
   import { prisma } from '../apps/web/src/lib/prisma';
   import crypto from 'crypto';

   const OLD_KEY = Buffer.from(process.env.SUMMARY_ENCRYPTION_KEY!, 'hex');
   const NEW_KEY = Buffer.from(process.env.SUMMARY_ENCRYPTION_KEY_NEW!, 'hex');
   const ALGORITHM = 'aes-256-gcm';

   async function decryptWithOldKey(encryptedText: string): Promise<string> {
     const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
     const decipher = crypto.createDecipheriv(
       ALGORITHM,
       OLD_KEY,
       Buffer.from(ivHex, 'hex')
     );
     decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
     let decrypted = decipher.update(encrypted, 'hex', 'utf8');
     decrypted += decipher.final('utf8');
     return decrypted;
   }

   async function encryptWithNewKey(text: string): Promise<string> {
     const iv = crypto.randomBytes(16);
     const cipher = crypto.createCipheriv(ALGORITHM, NEW_KEY, iv);
     let encrypted = cipher.update(text, 'utf8', 'hex');
     encrypted += cipher.final('hex');
     const authTag = cipher.getAuthTag();
     return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
   }

   async function rotateKeys() {
     console.log('Starting key rotation...');

     // Get all ChatSummary records
     const summaries = await prisma.chatSummary.findMany({
       select: {
         id: true,
         summary: true,
         adherenceNotes: true,
         keyThemes: true,
         recommendedActions: true,
       },
     });

     console.log(`Found ${summaries.length} summaries to re-encrypt`);

     let successCount = 0;
     let errorCount = 0;

     for (const summary of summaries) {
       try {
         // Decrypt with old key
         const decryptedSummary = summary.summary
           ? await decryptWithOldKey(summary.summary)
           : null;

         const decryptedAdherence = summary.adherenceNotes
           ? await decryptWithOldKey(summary.adherenceNotes as string)
           : null;

         const decryptedThemes = Array.isArray(summary.keyThemes)
           ? await Promise.all(
               (summary.keyThemes as string[]).map(t => decryptWithOldKey(t))
             )
           : [];

         const decryptedActions = Array.isArray(summary.recommendedActions)
           ? await Promise.all(
               (summary.recommendedActions as string[]).map(a => decryptWithOldKey(a))
             )
           : [];

         // Re-encrypt with new key
         const reencryptedSummary = decryptedSummary
           ? await encryptWithNewKey(decryptedSummary)
           : null;

         const reencryptedAdherence = decryptedAdherence
           ? await encryptWithNewKey(decryptedAdherence)
           : null;

         const reencryptedThemes = await Promise.all(
           decryptedThemes.map(t => encryptWithNewKey(t))
         );

         const reencryptedActions = await Promise.all(
           decryptedActions.map(a => encryptWithNewKey(a))
         );

         // Update database with re-encrypted data
         await prisma.chatSummary.update({
           where: { id: summary.id },
           data: {
             summary: reencryptedSummary,
             adherenceNotes: reencryptedAdherence,
             keyThemes: reencryptedThemes,
             recommendedActions: reencryptedActions,
           },
         });

         successCount++;
         if (successCount % 100 === 0) {
           console.log(`Progress: ${successCount}/${summaries.length}`);
         }
       } catch (error) {
         console.error(`Failed to rotate key for summary ${summary.id}:`, error);
         errorCount++;
       }
     }

     console.log(`\nKey rotation complete:`);
     console.log(`✅ Success: ${successCount}`);
     console.log(`❌ Errors: ${errorCount}`);

     if (errorCount > 0) {
       throw new Error('Some records failed to re-encrypt. DO NOT remove old key yet.');
     }
   }

   rotateKeys()
     .then(() => {
       console.log('Key rotation successful. You can now switch to new key.');
       process.exit(0);
     })
     .catch((error) => {
       console.error('Key rotation failed:', error);
       process.exit(1);
     });
   ```

4. **Run re-encryption script**
   ```bash
   # Test on staging first
   npm run rotate-keys -- --dry-run

   # Run for real
   npm run rotate-keys
   ```

5. **Verify data integrity**
   ```bash
   # Read a few summaries via API
   curl https://your-app.com/api/chat/<session-id>/summary

   # Verify decryption works
   ```

6. **Switch to new key**
   ```bash
   # In Vercel/Railway, update environment variable
   SUMMARY_ENCRYPTION_KEY="<new-key-from-step-1>"

   # Remove old key
   unset SUMMARY_ENCRYPTION_KEY_NEW

   # Redeploy app
   vercel deploy --prod
   ```

7. **Monitor for errors**
   - Watch Sentry for decryption errors
   - Check logs for 24 hours
   - If errors occur, immediately rollback to old key

8. **Delete old key**
   - After 7 days with no errors, permanently delete old key
   - Update password manager / secrets vault

---

### Strategy B: Dual-Key Support (Enterprise)

**Best for:** Large datasets (> 10,000 records) or zero-downtime requirement

**How it works:**
1. Support both old and new key simultaneously
2. New summaries use new key
3. Old summaries gradually re-encrypted in background
4. After 100% migration, remove old key

**Implementation:**

```typescript
// Modified encryption.ts
export function getEncryptionKeys(): { primary: Buffer; fallback?: Buffer } {
  const primary = Buffer.from(process.env.SUMMARY_ENCRYPTION_KEY!, 'hex');
  const fallback = process.env.SUMMARY_ENCRYPTION_KEY_OLD
    ? Buffer.from(process.env.SUMMARY_ENCRYPTION_KEY_OLD, 'hex')
    : undefined;

  return { primary, fallback };
}

export function decryptField(encryptedText: string): string {
  const { primary, fallback } = getEncryptionKeys();

  // Try primary key first
  try {
    return decryptWithKey(encryptedText, primary);
  } catch (error) {
    // Fallback to old key if primary fails
    if (fallback) {
      console.warn('Decrypting with fallback key (schedule re-encryption)');
      return decryptWithKey(encryptedText, fallback);
    }
    throw error;
  }
}
```

**Background job to re-encrypt:**

```typescript
// Runs nightly, re-encrypts 1000 old records
async function backgroundReencryption() {
  const oldSummaries = await prisma.chatSummary.findMany({
    where: { encryptionKeyVersion: 1 }, // Mark old records
    take: 1000,
  });

  for (const summary of oldSummaries) {
    const decrypted = decryptField(summary.summary); // Uses fallback key
    const reencrypted = encryptField(decrypted); // Uses new key

    await prisma.chatSummary.update({
      where: { id: summary.id },
      data: {
        summary: reencrypted,
        encryptionKeyVersion: 2,
      },
    });
  }
}
```

---

## Emergency Key Compromise Response

If you suspect the encryption key was exposed:

### Immediate Actions (< 5 minutes)

1. **Generate new key immediately**
   ```bash
   openssl rand -hex 32
   ```

2. **Disable summary viewing**
   ```bash
   # Add kill switch in Vercel
   DISABLE_SUMMARY_VIEWING="true"
   ```

3. **Notify security team**
   - Email: security@university.edu
   - Slack: #security-incidents

### Recovery Actions (< 1 hour)

1. **Deploy new key as secondary**
   ```bash
   SUMMARY_ENCRYPTION_KEY_NEW="<new-key>"
   ```

2. **Run re-encryption script** (see Strategy A above)

3. **Audit access logs**
   ```sql
   SELECT * FROM audit_logs
   WHERE resource LIKE 'ChatSummary:%'
   AND created_at > NOW() - INTERVAL '30 days'
   ORDER BY created_at DESC;
   ```

4. **Identify affected athletes**
   - Who's summaries were accessed during exposure window?
   - Send notification email (template below)

### Notification Email Template

```
Subject: Security Update - Chat Summary Data Protection

Dear [Athlete Name],

As part of our ongoing commitment to data security, we recently rotated
encryption keys for our weekly chat summary system.

What happened:
- We identified a potential security exposure of an encryption key
- No unauthorized access to your data was detected
- We immediately rotated to a new encryption key

What we did:
- Generated new encryption key
- Re-encrypted all stored data
- Audited all access logs
- Implemented additional safeguards

What you should do:
- No action required on your part
- Your chat summaries remain secure and private
- Contact us if you have questions: support@aisportsagent.com

We take your privacy seriously and apologize for any concern this may cause.

Best regards,
AI Sports Agent Security Team
```

---

## Key Rotation Checklist

### Pre-Rotation

- [ ] Verify backup exists (database snapshot)
- [ ] Test re-encryption script on staging
- [ ] Verify new key meets requirements (32 bytes, random)
- [ ] Schedule maintenance window (if needed)
- [ ] Notify team of planned rotation

### During Rotation

- [ ] Generate new key: `openssl rand -hex 32`
- [ ] Add new key as `SUMMARY_ENCRYPTION_KEY_NEW`
- [ ] Run re-encryption script
- [ ] Verify sample decryptions work
- [ ] Monitor error rates

### Post-Rotation

- [ ] Switch to new key: `SUMMARY_ENCRYPTION_KEY=<new-key>`
- [ ] Redeploy application
- [ ] Monitor for 24 hours
- [ ] Verify no decryption errors in Sentry
- [ ] Remove old key after 7 days
- [ ] Update documentation with rotation date

---

## Troubleshooting

### Error: "Decryption failed. Data may be tampered or key is incorrect."

**Cause:** Trying to decrypt with wrong key

**Fix:**
```bash
# Verify you have the correct key
echo $SUMMARY_ENCRYPTION_KEY | wc -c
# Should output: 65 (64 hex chars + newline)

# Check if key matches what's in password manager
# If not, restore from backup

# If you lost the key, you CANNOT recover the data
# You must restore from a database backup
```

### Error: "Invalid encrypted text format"

**Cause:** Data was not encrypted, or format is corrupted

**Fix:**
```typescript
// Check if field is actually encrypted
const summary = await prisma.chatSummary.findUnique({
  where: { id: 'xyz' },
  select: { summary: true },
});

console.log(summary.summary);
// Should look like: "a1b2c3...:d4e5f6...:g7h8i9...."
// If it's plain text, it was never encrypted
```

### Partial Re-Encryption Failure

**Problem:** Script failed halfway through

**Fix:**
```typescript
// Add checkpointing to re-encryption script
let checkpoint = 0;

for (let i = checkpoint; i < summaries.length; i++) {
  try {
    await reencryptSummary(summaries[i]);

    // Save checkpoint every 100 records
    if (i % 100 === 0) {
      await fs.writeFile('checkpoint.txt', i.toString());
    }
  } catch (error) {
    console.error(`Failed at index ${i}. Checkpoint saved.`);
    throw error;
  }
}
```

---

## Best Practices

1. **Never log encryption keys**
   - No console.log, no Sentry, no audit logs
   - Only log key rotation events (not keys themselves)

2. **Store keys in secrets vault**
   - 1Password, LastPass, AWS Secrets Manager
   - Not in .env files or code

3. **Rotate on schedule**
   - Set calendar reminder for every 90 days
   - Automate with CI/CD if possible

4. **Test rotation in staging first**
   - Always test with staging data
   - Verify decryption works before production

5. **Keep old keys temporarily**
   - Don't delete immediately after rotation
   - Wait 7 days to ensure no issues

6. **Document rotation history**
   - Track when keys were rotated
   - Who performed rotation
   - Any issues encountered

---

## Key Rotation Log

| Date | Performed By | Reason | Old Key ID | New Key ID | Status |
|------|--------------|--------|------------|------------|--------|
| 2025-01-04 | Setup | Initial key | N/A | key-001 | Active |
| _Future_ | _TBD_ | _Scheduled_ | key-001 | key-002 | _Planned_ |

**Key ID Format:** `key-XXX` (last 3 chars of key hex)

---

**Last Updated:** 2025-01-04
**Version:** 1.0.0
