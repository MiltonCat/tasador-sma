import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { BRAND, TASADOR_URL } from "./config";

// Alternativa libre a Airbnb Cereal (geométrica humanista, muy similar).
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const TITLE = "Tasador Inmobiliario — San Martín de los Andes";
const DESCRIPTION =
  "Estimá gratis el valor de tu propiedad en San Martín de los Andes con inteligencia artificial. Modelo entrenado con datos reales del mercado patagónico. Por Catalán Propiedades.";

export const metadata: Metadata = {
  metadataBase: new URL(TASADOR_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: TASADOR_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: TASADOR_URL,
    siteName: `Tasador SMA · ${BRAND}`,
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
