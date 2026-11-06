import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kartal Briç Spor Kulübü",
  description:
    "Kartal Briç Spor Kulübü: turnuvalar, eğitimler ve haftalık oyunlarla her seviyeden oyuncu için briç.",
  icons: { icon: "/logo.jpg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
