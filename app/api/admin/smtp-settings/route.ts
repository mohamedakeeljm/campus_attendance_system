import { NextRequest, NextResponse } from 'next/server';
import { getSavedSmtpConfig, saveSmtpConfig } from '../../../../lib/smtpStorage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = getSavedSmtpConfig();
    return NextResponse.json({
      success: true,
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        adminEmail: config.adminEmail,
        hasPassword: Boolean(config.pass && config.pass.trim().length > 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve SMTP settings.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { host, port, secure, user, pass, adminEmail } = body;

    const saved = saveSmtpConfig({
      host,
      port,
      secure,
      user,
      pass,
      adminEmail,
    });

    return NextResponse.json({
      success: true,
      message: 'SMTP settings saved successfully!',
      config: {
        host: saved.host,
        port: saved.port,
        secure: saved.secure,
        user: saved.user,
        adminEmail: saved.adminEmail,
        hasPassword: Boolean(saved.pass && saved.pass.trim().length > 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to save SMTP settings.' },
      { status: 500 }
    );
  }
}
