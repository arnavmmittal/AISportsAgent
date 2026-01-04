import { z } from 'zod';
import { sanitizeHtml } from '@/lib/validation';

/**
 * Sign-up validation schema
 * Validates user registration data with strong password requirements
 */
export const signupSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .transform(sanitizeHtml), // XSS prevention

  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  role: z.enum(['ATHLETE', 'COACH'], {
    errorMap: () => ({ message: 'Role must be either ATHLETE or COACH' }),
  }),

  sport: z.string()
    .min(2, 'Sport is required')
    .max(50, 'Sport name too long')
    .trim()
    .transform(sanitizeHtml), // XSS prevention

  year: z.string()
    .optional()
    .refine((val) => !val || ['FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR', 'GRADUATE'].includes(val), {
      message: 'Year must be FRESHMAN, SOPHOMORE, JUNIOR, SENIOR, or GRADUATE',
    }),

  title: z.string()
    .optional()
    .transform((val) => val ? sanitizeHtml(val) : val) // XSS prevention
    .refine((val) => !val || val.length <= 100, {
      message: 'Title must be less than 100 characters',
    }),
});

export type SignupInput = z.infer<typeof signupSchema>;

/**
 * Sign-in validation schema
 */
export const signinSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(1, 'Password is required'),
});

export type SigninInput = z.infer<typeof signinSchema>;

/**
 * Password strength calculator
 * Returns a score from 0-4:
 * 0 = Very Weak
 * 1 = Weak
 * 2 = Fair
 * 3 = Good
 * 4 = Strong
 */
export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;

  let strength = 0;

  // Length check
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++; // Special characters

  return Math.min(strength, 4);
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(strength: number): string {
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return labels[strength] || 'Very Weak';
}

/**
 * Get password strength color (Tailwind classes)
 */
export function getPasswordStrengthColor(strength: number): string {
  const colors = [
    'bg-red-500',      // Very Weak
    'bg-orange-500',   // Weak
    'bg-yellow-500',   // Fair
    'bg-blue-500',     // Good
    'bg-green-500',    // Strong
  ];
  return colors[strength] || 'bg-gray-300';
}
