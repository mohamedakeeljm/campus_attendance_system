import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '../../../../lib/otpStore';
import { getAuthorizedAdminEmail } from '../../../../lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const adminEmail = (body.adminEmail && String(body.adminEmail).trim()) || (body.email && String(body.email).trim()) || getAuthorizedAdminEmail();
    const code = body.code ? String(body.code).trim() : '';
    const newPassword = body.newPassword ? String(body.newPassword).trim() : '';

    if (!code) {
      return NextResponse.json(
        { success: false, error: '6-digit verification code is required.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 3) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 3 characters long.' },
        { status: 400 }
      );
    }

    // Verify OTP code for single admin email
    const verification = verifyOtp(adminEmail, code);
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.error || 'Invalid or expired code.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password verified and reset successfully for Admin.',
    });
  } catch (error: any) {
    console.error('Error in verify-reset-code route:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
