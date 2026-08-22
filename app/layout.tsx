import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leilighet-spillet",
  description: "Pixel-art flytteplanlegger for to samboere",
};

const THEME_INIT_SCRIPT = `
  (function () {
    try {
      var stored = localStorage.getItem("theme");
      var theme = stored === "light" || stored === "dark"
        ? stored
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.dataset.theme = theme;
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Skriptet under setter data-theme på <html> før React hydrerer, så DOM-en
    // har et attributt serveren ikke sendte. suppressHydrationWarning sier til
    // React at akkurat dette elementet får lov til å avvike.
    <html
      lang="no"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
    <head>
        <script dangerouslySetInnerHTML= {{__html: THEME_INIT_SCRIPT}} />
        </head>
        <body>
            <ThemeToggle />
                {children}
      </body>
    </html>
  );
}
