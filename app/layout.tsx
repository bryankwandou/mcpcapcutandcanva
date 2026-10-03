import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "AXIOM",
  description: "AXIOM — personal operator station for a Grok-class mind. Megaprompt, compiler, chat.",
  icons: { icon: "/favicon.svg" },
  openGraph: { title: "AXIOM", description: "Personal operator station for a Grok-class mind.", images: ["/og.jpg"] },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};
export const viewport: Viewport = { themeColor: "#0a0b0c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Syne:wght@500;600;700&display=swap"
        />
      </head>
      <body className="bg-bg font-sans text-fg">{children}</body>
    </html>
  );
}
