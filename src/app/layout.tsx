import React from "react";
import type { Metadata, Viewport } from "next";
import { Poppins, Montserrat } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { RegisterSW } from "@/components/pwa/register-sw";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Rei do Picadão",
  description: "A melhor porção da cidade!",
  appleWebApp: {
    capable: true,
    title: "Rei do Picadão",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  openGraph: {
    title: "Rei do Picadão",
    description: "A melhor porção da cidade!",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Rei do Picadão - Delivery de porções",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rei do Picadão",
    description: "A melhor porção da cidade!",
    images: ["/images/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dc2626" },
    { media: "(prefers-color-scheme: dark)", color: "#1e293b" },
  ],
  viewportFit: "cover",
};

import { ptBR } from "@clerk/localizations";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR}>
      <html
        lang="pt-BR"
        className={`${poppins.variable} ${montserrat.variable} h-full antialiased`}
      >
        <body suppressHydrationWarning className="min-h-full flex flex-col">
          {children}
          <Toaster position="top-center" />
          <RegisterSW />
          <InstallPrompt />
        </body>
      </html>
    </ClerkProvider>
  );
}
