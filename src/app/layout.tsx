import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./hub.css";
import { MarketplaceProvider } from "@/providers/marketplace-provider";

const geistSans = localFont({
  src: "../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "../../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "AutoPart Hub | The right part. The right place.",
    template: "%s | AutoPart Hub",
  },
  description:
    "Discover vehicle spare parts, connect with local sellers and find your fit across Sri Lanka.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <MarketplaceProvider>{children}</MarketplaceProvider>
      </body>
    </html>
  );
}
