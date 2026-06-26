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
      <body className="min-h-screen" style={{ backgroundColor: "#f5f5f7" }}>
        <nav
          className="sticky top-0 z-50 flex items-center px-6"
          style={{ backgroundColor: "#000000", height: "44px" }}
        >
          <span
            className="text-white font-normal tracking-[-0.12px]"
            style={{ fontSize: "12px" }}
          >
            To-Do Board
          </span>
        </nav>
        {children}
      </body>
    </html>
  );
}
