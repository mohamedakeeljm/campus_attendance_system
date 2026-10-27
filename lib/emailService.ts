import nodemailer from 'nodemailer';
import { getSavedSmtpConfig, SavedSmtpConfig } from './smtpStorage';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

/**
 * Single authorized administrator email for password recovery
 */
export function getAuthorizedAdminEmail(): string {
  const saved = getSavedSmtpConfig();
  return saved.adminEmail || saved.user || 'brainiacscampus@gmail.com';
}

/**
 * Get current SMTP settings from saved configuration or process.env
 */
export function getSmtpConfig(): SmtpConfig | null {
  const saved = getSavedSmtpConfig();

  if (!saved.host || !saved.user || !saved.pass) {
    return null;
  }

  return {
    host: saved.host,
    port: saved.port,
    secure: saved.secure,
    user: saved.user,
    pass: saved.pass,
    from: saved.from,
  };
}

/**
 * Send Password Reset OTP email
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  otpCode: string,
  customSmtp?: SmtpConfig
): Promise<{ success: boolean; isDevMode?: boolean; error?: string }> {
  const config = customSmtp || getSmtpConfig();

  // If no SMTP configured, operate in setup/dev mode and log OTP to server console
  if (!config) {
    console.log('====================================================');
    console.log(`[SMTP DEV MODE] Password Reset OTP for ${toEmail}: ${otpCode}`);
    console.log('To send live emails, configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env.local');
    console.log('====================================================');
    return {
      success: true,
      isDevMode: true,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false, // Prevents self-signed cert issues during setup
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset Code - Brainiacs Campus</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 30px; color: #1e293b;">
        <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background-color: #2563eb; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Brainiacs Campus</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Staff Attendance System &bull; Admin Portal</p>
          </div>
          <div style="padding: 32px 28px;">
            <h2 style="font-size: 17px; font-weight: 700; color: #0f172a; margin-top: 0;">Password Reset Request</h2>
            <p style="font-size: 13px; line-height: 1.6; color: #475569;">
              You requested to reset your Administrator password for the Brainiacs Campus Staff Attendance System.
            </p>
            <p style="font-size: 13px; line-height: 1.6; color: #475569;">
              Please use the 6-digit verification code below to complete your password reset:
            </p>
            <div style="margin: 28px 0; text-align: center;">
              <div style="display: inline-block; background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 14px 32px;">
                <span style="font-family: monospace, Courier, monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #1d4ed8;">
                  ${otpCode}
                </span>
              </div>
              <p style="font-size: 11px; color: #94a3b8; margin: 8px 0 0 0;">This code will expire in 10 minutes.</p>
            </div>
            <p style="font-size: 12px; line-height: 1.5; color: #64748b;">
              If you did not request this password reset, please ignore this email or make sure your admin account is secure.
            </p>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
            &copy; ${new Date().getFullYear()} Brainiacs Campus &bull; Automated System Security Notification
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: config.from,
      to: toEmail,
      subject: `[Brainiacs Campus] Admin Password Reset Code: ${otpCode}`,
      text: `Your password reset code is: ${otpCode}. It will expire in 10 minutes.`,
      html: htmlContent,
    });

    return { success: true, isDevMode: false };
  } catch (err: any) {
    console.error('Failed to send SMTP email:', err);
    return {
      success: false,
      error: err?.message || 'SMTP server connection failed. Please verify your SMTP settings.',
    };
  }
}
