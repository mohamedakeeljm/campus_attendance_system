import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSavedSmtpConfig } from '../../../../lib/smtpStorage';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const current = getSavedSmtpConfig();

    const host = body.host?.trim() || current.host;
    const port = body.port ? Number(body.port) : current.port;
    const secure = body.secure !== undefined ? Boolean(body.secure) : (port === 465);
    const user = body.user?.trim() || current.user;
    const pass = body.pass !== undefined && body.pass !== '' ? body.pass.trim() : current.pass;
    const adminEmail = body.adminEmail?.trim() || current.adminEmail;

    if (!host || !user || !pass) {
      return NextResponse.json(
        {
          success: false,
          error: 'SMTP host, user email, and password / app password are required to test connection.',
        },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });

    // Verify SMTP connection
    await transporter.verify();

    // Send a test email
    await transporter.sendMail({
      from: `"Brainiacs Campus Admin" <${user}>`,
      to: adminEmail,
      subject: '✅ [Brainiacs Campus] SMTP Connection Test Successful',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background: #f8fafc; border-radius: 12px; color: #1e293b;">
          <h2 style="color: #2563eb; margin-top: 0;">Brainiacs Campus - SMTP Verification</h2>
          <p>Congratulations! Your SMTP email setup is working correctly.</p>
          <div style="padding: 12px 16px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0; font-size: 13px;"><strong>Sender Email:</strong> ${user}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px;"><strong>Recipient Email:</strong> ${adminEmail}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px;"><strong>Host:</strong> ${host}:${port} (${secure ? 'SSL' : 'TLS'})</p>
          </div>
          <p style="font-size: 12px; color: #64748b;">Password reset verification codes will be delivered using this SMTP configuration.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `SMTP test email successfully sent to ${adminEmail}!`,
    });
  } catch (error: any) {
    console.error('SMTP test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'SMTP connection failed. Check your host, port, email, and app password.',
      },
      { status: 500 }
    );
  }
}
