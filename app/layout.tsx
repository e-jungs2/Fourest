import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Persona Trip Council",
  description: "페르소나 기반 여행 의사결정 MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
