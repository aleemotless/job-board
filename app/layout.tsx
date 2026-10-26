import type { Metadata } from "next";
import { Archivo_Black, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { cn } from "cn";
import { SITE } from "@/lib/config";
import "./globals.css";

// Fonts for the design system in globals.css (--font-display / --font-sans / --font-mono).
const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { template: `%s · ${SITE.name}`, default: SITE.name },
  description: SITE.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(archivoBlack.variable, spaceGrotesk.variable, jetbrainsMono.variable, "h-full antialiased")}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
