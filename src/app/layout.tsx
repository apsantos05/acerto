import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SITE_URL, SITE_NAME } from "@/lib/catalog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Plataforma para vestibulandos de Medicina`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Provas, gabaritos, apostilas, simulados e resumos para vestibulares de Medicina — organizados por universidade, matéria e vestibular.",
  keywords: [
    "Medicina",
    "vestibular",
    "Fuvest",
    "Comvest",
    "ENEM",
    "provas",
    "simulados",
    "apostilas",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: `${SITE_NAME} | Materiais para vestibulares de Medicina`,
    description:
      "Provas, gabaritos, apostilas, simulados e resumos para vestibulares de Medicina.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Materiais para vestibulares de Medicina`,
    description:
      "Provas, gabaritos, apostilas, simulados e resumos para vestibulares de Medicina.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
