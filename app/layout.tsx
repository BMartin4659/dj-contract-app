import { Inter } from 'next/font/google';

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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/dj-bobby-drake-logo.png" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
} 