import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import ThemeToggle from "../components/ThemeToggle";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Smart Bookmark App",
  description: "A fast, secure bookmark manager with live sync.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-[100dvh] relative`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <div className="bg-mesh" />
          <div className="h-[100dvh] flex flex-col relative z-10">
            <main className="flex-1 overflow-y-auto">{children}</main>
            <footer className="shrink-0 border-t border-gray-200 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/20">
              <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-white/50">
                  © {new Date().getFullYear()} Smart Bookmark App
                </p>
                <ThemeToggle />
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
