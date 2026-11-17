import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { FLIGHT } from "@/data/flight";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: `Seat selection · ${FLIGHT.origin} → ${FLIGHT.destination} ${FLIGHT.number}`,
  description:
    "Pick seats for up to six passengers on a live cabin map, see the price update instantly and confirm your booking.",
};

/** `cover` lets the fixed bottom bar extend under the iPhone home indicator (padded by the safe area). */
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
