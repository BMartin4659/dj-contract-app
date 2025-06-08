import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./components/ClientLayout";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Live City DJ Contract",
  description: "Book your DJ services with Live City - Professional DJ services for weddings, parties and events",
  keywords: "DJ, booking, contract, event, party, wedding, live music",
  viewport: "width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0",
  themeColor: "#0070f3",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
