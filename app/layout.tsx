import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/components/Nav";
import Topbar from "@/components/Topbar";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "PI-hub",
  description: "Principal Investigator Hub for eSPUD — research plans, exploration, setup, and artifact tracking.",
  applicationName: "PI-hub",
  appleWebApp: {
    capable: true,
    title: "PI-hub",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#1c1f2e",
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
                <footer className="app-footer">
                  <span>
                    Built by{" "}
                    <a href="https://shashankbl.github.io" target="_blank" rel="noreferrer">
                      Shashank Bangalore Lakshman
                    </a>
                  </span>
                  <span className="sep">·</span>
                  <span>Made with Claude Code and Conductor</span>
                </footer>
              </div>
            </div>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
