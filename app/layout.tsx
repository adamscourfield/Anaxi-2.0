import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-bg text-text">
        <header className="border-b border-border bg-surface/85 backdrop-blur">
          <div className="mx-auto flex max-w-[1680px] items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2 text-[18px] font-semibold">
              <Image src="/anaxi-logo.png" alt="Anaxi" width={24} height={24} priority className="h-6 w-6 object-contain" />
              <span>Anaxi</span>
            </Link>
            <form action="/api/auth/signout" method="post">
              <button className="calm-transition rounded-md px-3 py-1 text-sm text-muted hover:bg-divider" type="submit">Logout</button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1680px] px-4 py-6 md:px-6">{children}</main>
      </body>
    </html>
  );
}
