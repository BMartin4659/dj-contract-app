import { Inter } from 'next/font/google';
import './globals.css';
import ClientOnly from './components/ClientOnly';
import FixHydration from './components/FixHydration';
import CustomDocument from './custom-document';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
        <link rel="icon" href="/dj-bobby-drake-logo.png" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <CustomDocument />
        <FixHydration />
        <ClientOnly>
          {/* Background wrapper for mobile devices */}
          <div className="background-wrapper">
            <div className="mobile-background"></div>
            <div className="ios-background-fix"></div>
          </div>
          {children}
        </ClientOnly>
      </body>
    </html>
  )
} 