import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/components/Nav";
import Topbar from "@/components/Topbar";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "PI-hub",
  description: "Principal Investigator Hub for eSPUD — research plans, exploration, setup, and artifact tracking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <div className="page">
            <div className="shell">
              <Sidebar />
              <div className="content">
                <Topbar />
                <main className="main">{children}</main>
              </div>
            </div>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
