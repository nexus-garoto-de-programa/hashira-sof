import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { DotGridCanvas } from "@/components/DotGridCanvas";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LoadingProvider } from "@/context/LoadingContext";
import { NavigationLoadingTrigger } from "@/components/NavigationLoadingTrigger";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "HASHIRA — Gestão de Demandas (Modelo Cascata)",
  description: "Plataforma de Gestão de Demandas em Modelo Cascata da Hashira",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} font-sans antialiased relative min-h-screen`} style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
        <ThemeProvider>
          <LoadingProvider>
            {/* Ouve eventos de navegação com Suspense boundary para searchParams */}
            <Suspense fallback={null}>
              <NavigationLoadingTrigger />
            </Suspense>

            {/* Full screen interactive canvas dot grid background */}
            <DotGridCanvas />

            {/* App Content */}
            <div className="relative z-10 min-h-screen">
              {children}
            </div>

            <Toaster position="bottom-right" richColors />
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
