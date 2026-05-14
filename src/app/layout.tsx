import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import { AppProvider } from "../context/AppContext";
import GlobalLayout from "../components/GlobalLayout";
import "./globals.css";
import SmoothScroll from "../components/SmoothScroll";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif', style: ['normal', 'italic'] });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: "Navanika Heritage",
  description: "Where Heritage Meets Contemporary Elegance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`scrollbar-hide ${inter.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <head>
        <link rel="icon" href="/logo.png" sizes="any" />
      </head>
      <body>
        <AppProvider>
          <SmoothScroll>
            <GlobalLayout>
              {children}
            </GlobalLayout>
          </SmoothScroll>
        </AppProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}

