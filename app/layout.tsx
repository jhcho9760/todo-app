import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "To-Do Board",
  description: "공용 To-Do 보드",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
