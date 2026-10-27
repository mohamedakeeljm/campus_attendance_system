import fs from 'fs';
import path from 'path';

export interface SavedSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  adminEmail: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const SMTP_CONFIG_FILE = path.join(DATA_DIR, 'smtp-config.json');

export const DEFAULT_SMTP_CONFIG: SavedSmtpConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  user: 'brainiacscampus@gmail.com',
  pass: '',
  from: '"Brainiacs Campus Admin" <brainiacscampus@gmail.com>',
  adminEmail: 'brainiacscampus@gmail.com',
};

/**
 * Load saved SMTP settings from server storage
 */
export function getSavedSmtpConfig(): SavedSmtpConfig {
  try {
    if (fs.existsSync(SMTP_CONFIG_FILE)) {
      const content = fs.readFileSync(SMTP_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        host: parsed.host || DEFAULT_SMTP_CONFIG.host,
        port: Number(parsed.port) || DEFAULT_SMTP_CONFIG.port,
        secure: parsed.secure ?? (Number(parsed.port) === 465),
        user: parsed.user || DEFAULT_SMTP_CONFIG.user,
        pass: parsed.pass || '',
        from: parsed.from || `"Brainiacs Campus Admin" <${parsed.user || DEFAULT_SMTP_CONFIG.user}>`,
        adminEmail: parsed.adminEmail || parsed.user || DEFAULT_SMTP_CONFIG.adminEmail,
      };
    }
  } catch (error) {
    console.error('Failed to read SMTP config file:', error);
  }

  // Fallback to process.env or defaults
  return {
    host: process.env.SMTP_HOST || DEFAULT_SMTP_CONFIG.host,
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    user: process.env.SMTP_USER || DEFAULT_SMTP_CONFIG.user,
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || `"Brainiacs Campus Admin" <${process.env.SMTP_USER || DEFAULT_SMTP_CONFIG.user}>`,
    adminEmail: process.env.ADMIN_EMAIL || process.env.SMTP_USER || DEFAULT_SMTP_CONFIG.adminEmail,
  };
}

/**
 * Save SMTP settings to persistent server storage
 */
export function saveSmtpConfig(config: Partial<SavedSmtpConfig>): SavedSmtpConfig {
  const current = getSavedSmtpConfig();
  
  const updated: SavedSmtpConfig = {
    host: config.host?.trim() || current.host,
    port: config.port ? Number(config.port) : current.port,
    secure: config.secure !== undefined ? Boolean(config.secure) : (Number(config.port || current.port) === 465),
    user: config.user?.trim() || current.user,
    // Preserve existing password if not provided or left blank
    pass: config.pass !== undefined && config.pass !== '' ? config.pass.trim() : current.pass,
    from: config.from?.trim() || `"Brainiacs Campus Admin" <${config.user?.trim() || current.user}>`,
    adminEmail: config.adminEmail?.trim() || config.user?.trim() || current.adminEmail,
  };

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SMTP_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save SMTP config file:', error);
  }

  return updated;
}
