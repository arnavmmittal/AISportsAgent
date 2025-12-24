/**
 * Field-Level Encryption for Weekly Chat Summaries
 *
 * Uses AES-256-GCM for authenticated encryption of sensitive fields:
 * - adherenceNotes
 * - keyThemes elements
 * - recommendedActions elements
 *
 * Numeric scores are NOT encrypted (needed for aggregation queries)
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * Get encryption key from environment variable
 * Key must be 32 bytes (64 hex characters)
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.SUMMARY_ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error(
      'SUMMARY_ENCRYPTION_KEY not set. Generate with: openssl rand -hex 32'
    );
  }

  if (keyHex.length !== 64) {
    throw new Error(
      'SUMMARY_ENCRYPTION_KEY must be 64 hex characters (32 bytes)'
    );
  }

  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt a string field using AES-256-GCM
 *
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encrypted
 *
 * @example
 * const encrypted = encryptField("Athlete showing good progress");
 * // Returns: "a1b2c3....:d4e5f6....:g7h8i9...."
 */
export function encryptField(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16); // 128-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a field encrypted with encryptField()
 *
 * @param encryptedText - Encrypted string in format: iv:authTag:encrypted
 * @returns Decrypted plain text
 *
 * @throws Error if decryption fails (tampered data or wrong key)
 *
 * @example
 * const decrypted = decryptField("a1b2c3....:d4e5f6....:g7h8i9....");
 * // Returns: "Athlete showing good progress"
 */
export function decryptField(encryptedText: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted text format. Expected: iv:authTag:encrypted');
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  try {
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed. Data may be tampered or key is incorrect.');
  }
}

/**
 * Encrypt an array of strings
 *
 * @param items - Array of plain text strings
 * @returns Array of encrypted strings
 *
 * @example
 * const encrypted = encryptArray(["breathing exercises", "sleep hygiene"]);
 */
export function encryptArray(items: string[]): string[] {
  return items.map(item => encryptField(item));
}

/**
 * Decrypt an array of encrypted strings
 *
 * @param encryptedItems - Array of encrypted strings
 * @returns Array of decrypted plain text strings
 *
 * @example
 * const decrypted = decryptArray(["a1b2...", "c3d4..."]);
 */
export function decryptArray(encryptedItems: string[]): string[] {
  return encryptedItems.map(item => decryptField(item));
}

/**
 * Safely encrypt a field that might be null/undefined
 *
 * @param text - Plain text or null/undefined
 * @returns Encrypted string or null
 */
export function encryptFieldSafe(text: string | null | undefined): string | null {
  if (!text) return null;
  return encryptField(text);
}

/**
 * Safely decrypt a field that might be null
 *
 * @param encryptedText - Encrypted string or null
 * @returns Decrypted plain text or null
 */
export function decryptFieldSafe(encryptedText: string | null): string | null {
  if (!encryptedText) return null;
  return decryptField(encryptedText);
}
