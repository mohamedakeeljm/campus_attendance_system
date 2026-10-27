/**
 * In-memory OTP verification store
 * Keeps track of 6-digit codes generated for password reset with expiration
 */

interface OtpEntry {
  code: string;
  email: string;
  expiresAt: number; // timestamp in ms
  attempts: number;
}

// Global store across API route invocations in Node
const globalAny: any = global;
if (!globalAny.__BRAINIACS_OTP_STORE__) {
  globalAny.__BRAINIACS_OTP_STORE__ = new Map<string, OtpEntry>();
}
const otpStore: Map<string, OtpEntry> = globalAny.__BRAINIACS_OTP_STORE__;

/**
 * Generate and store a secure 6-digit OTP code (valid for 10 minutes)
 */
export function generateOtp(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  
  // 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(normalizedEmail, {
    code,
    email: normalizedEmail,
    expiresAt,
    attempts: 0,
  });

  return code;
}

/**
 * Verify an OTP code for a given email
 */
export function verifyOtp(email: string, codeInput: string): { valid: boolean; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = otpStore.get(normalizedEmail);

  if (!entry) {
    return { valid: false, error: 'No verification code was requested for this email or it has expired.' };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedEmail);
    return { valid: false, error: 'Verification code has expired. Please request a new code.' };
  }

  entry.attempts++;
  if (entry.attempts > 5) {
    otpStore.delete(normalizedEmail);
    return { valid: false, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  if (entry.code.trim() !== codeInput.trim()) {
    return { valid: false, error: 'Incorrect verification code. Please check your email and try again.' };
  }

  // Once verified, remove from store to prevent reuse
  otpStore.delete(normalizedEmail);
  return { valid: true };
}
