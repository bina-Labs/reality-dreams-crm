import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/i18n/provider";
import { getLocale } from "@/i18n/server";
import { LOCALE_DIR } from "@/i18n/config";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Reality Dreams CRM",
  description: "Lead management for Reality Dreams Galápagos",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d9488",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={LOCALE_DIR[locale]} className={`${heebo.variable} h-full`}>
      <body className="min-h-full">
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
