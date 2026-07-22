import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      "https://harmonious-melba-73601b.netlify.app",
  ),
  title: "WESTBOUND — A peaceful walk west",
  description:
    "A kind man and his dog are walking west across America. Watch the calm journey, help keep him on course, or gently guide a scenic detour. Family-friendly, seasonal, and made to feel good.",
  openGraph: {
    title: "WESTBOUND — A man and his dog are walking across America",
    description:
      "Watch the live journey west. Help keep them on course, or send them on a scenic detour. When they reach the Pacific, it ends forever.",
    type: "website",
    images: [
      {
        url: "/media/scenes/packs/maine/summer-day.jpg",
        width: 1672,
        height: 941,
        alt: "The walker and his dog Beacon on a Maine road, heading west",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WESTBOUND — A man and his dog are walking across America",
    description:
      "Watch the live journey west. When they reach the Pacific, it ends forever.",
    images: ["/media/scenes/packs/maine/summer-day.jpg"],
  },
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
      <body className="min-h-full bg-black text-[var(--color-cream)]">
        {children}
      </body>
    </html>
  );
}
