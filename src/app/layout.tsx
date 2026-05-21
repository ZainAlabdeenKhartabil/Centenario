import type { Metadata } from "next";
import { Syncopate, Inter } from "next/font/google";
import "./globals.css";

const isProd = process.env.NODE_ENV === 'production';
const prefix = isProd ? '/Centenario' : '';

const syncopate = Syncopate({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-syncopate",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lamborghini Centenario V12 // Hyper Performance Telemetry",
  description: "Experience the high-performance deconstruction protocol of the naturally aspirated Lamborghini Centenario V12.",
  icons: {
    icon: `${prefix}/Lamborghini-logo.png`
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syncopate.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black">{children}</body>
    </html>
  );
}

