import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollProvider } from "@/components/providers/ScrollProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sc",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "我的旅行记录",
    template: "%s | 我的旅行记录",
  },
  description: "记录每一次旅行的美好瞬间",
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${notoSansSC.variable} antialiased`}
    >
      <body className="bg-black text-white min-h-screen flex flex-col">
        <Navbar />
        <ScrollProvider>
          <main className="flex-1">{children}</main>
        </ScrollProvider>
        <Footer />
      </body>
    </html>
  );
}
