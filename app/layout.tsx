import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Attendance Converter - Brainiacs Campus',
  description: 'Convert biometric attendance reports into the Brainiacs monthly attendance format.',
  icons: {
    icon: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-slate-50 min-h-screen text-slate-800">
        {children}
      </body>
    </html>
  );
}
