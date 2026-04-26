import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "triper",
  description: "친구들의 여행 페르소나로 함께 일정을 정하는 웹앱"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
