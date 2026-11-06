import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Yönetim | Kartal Briç",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
