import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SBTI 人格测试 | 戏仿版抽象人格测试",
    template: "%s | SBTI",
  },
  description: "SBTI 人格测试中文版，一个以网络梗和角色设定为核心的戏仿版人格测试，带你看看自己的抽象人格类型。",
  metadataBase: new URL("https://sbti.how"),
  openGraph: {
    locale: "zh_CN",
    type: "website",
    siteName: "SBTI 人格测试",
    title: "SBTI 人格测试 | 戏仿版抽象人格测试",
    description: "一个以网络梗和角色设定为核心的戏仿版人格测试，看看你的 SBTI 抽象人格类型。",
    url: "https://sbti.how/",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "SBTI 人格测试" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SBTI 人格测试 | 戏仿版抽象人格测试",
    description: "一个以网络梗和角色设定为核心的戏仿版人格测试，看看你的 SBTI 抽象人格类型。",
    images: ["/og-image.svg"],
  },
  icons: { icon: "/favicon.svg" },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BGRVF794BV"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-BGRVF794BV');`}
        </Script>
      </head>
      <body>
        <div className="site-shell home-shell">
          <header className="site-header">
            <a className="brand" href="/">
              <span className="brand-text">sbti.how</span>
            </a>
            <nav className="site-nav">
              <a href="/">首页</a>
              <a href="/types">人格类型</a>
              <a href="/create">创建问卷</a>
            </nav>
          </header>
          <main id="top" className="screen-shell">
            {children}
          </main>
          <footer className="site-footer">
            <p>SBTI 人格测试仅供娱乐。</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
