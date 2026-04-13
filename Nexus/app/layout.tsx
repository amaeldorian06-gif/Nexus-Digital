import type {Metadata} from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css'; // Global styles

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-headline',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'NEXUS.DIGITAL | L\'innovation au cœur de l\'Afrique Centrale',
  description: 'Sites haute performance · Cartes NFC · QR Dynamiques. Nous architecturons les infrastructures numériques des leaders de demain en Afrique Centrale.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className={`${spaceGrotesk.variable} ${inter.variable} font-body selection:bg-primary selection:text-on-primary`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
