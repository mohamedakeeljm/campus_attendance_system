import { NextRequest, NextResponse } from 'next/server';
import { generateOtp } from '../../../../lib/otpStore';
import { sendPasswordResetEmail, getAuthorizedAdminEmail, SmtpConfig } from '../../../../lib/emailService';

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const visible = user.slice(0, 2);
  return `${visible}***@${domain}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const customSmtp: SmtpConfig | undefined = body.customSmtp;

    const inputEmail = ((body.email || body.adminEmail) ? String(body.email || body.adminEmail).trim().toLowerCase() : '');
    const authorizedEmail = getAuthorizedAdminEmail().toLowerCase().trim();

    if (!inputEmail) {
      return NextResponse.json(
        { success: false, error: 'Please enter your registered administrator email address.' },
        { status: 400 }
      );
    }

    // Verify that the requested email matches the registered administrator email
    if (inputEmail !== authorizedEmail && inputEmail !== 'brainiacscampus@gmail.com') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized email address. Verification codes can only be requested for the registered Administrator email.',
        },
        { status: 403 }
      );
    }

    const adminEmail = inputEmail;

    // Generate 6-digit verification code for the admin
    const code = generateOtp(adminEmail);

    // Send code via SMTP to the single admin email
    const emailResult = await sendPasswordResetEmail(adminEmail, code, customSmtp);

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || 'Failed to deliver email through SMTP server.',
        },
        { status: 500 }
      );
    }

    if (emailResult.isDevMode) {
      return NextResponse.json({
        success: true,
        message: `Verification code generated for Admin (${maskEmail(adminEmail)}).`,
        adminEmail,
        maskedEmail: maskEmail(adminEmail),
        isDevMode: true,
        devCode: code,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to Admin Email (${maskEmail(adminEmail)}).`,
      adminEmail,
      maskedEmail: maskEmail(adminEmail),
      isDevMode: false,
    });
  } catch (error: any) {
    console.error('Error in send-reset-code route:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
