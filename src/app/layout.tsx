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
  description: "记录每一次旅行的美好瞬间，包括旅行攻略、照片画廊和足迹地图",
  keywords: ["旅行", "旅游", "攻略", "游记", "地图轨迹", "照片画廊"],
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  category: "travel",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "我的旅行记录",
    title: "我的旅行记录",
    description: "记录每一次旅行的美好瞬间",
  },
  twitter: {
    card: "summary_large_image",
    title: "我的旅行记录",
    description: "记录每一次旅行的美好瞬间",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
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
