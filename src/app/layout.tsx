import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventario | NOAH TECH SOLUTIONS",
  description: "Sistema web de registro de inventario de productos tecnológicos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
