import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boletim IPB Jaraguá do Sul",
  description: "Boletim da Igreja Presbiteriana do Brasil em Jaraguá do Sul",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
