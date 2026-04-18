import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GeoSense — AI Geothermal Intelligence",
  description: "Discover the geothermal potential beneath any property in seconds. AI-powered system recommendations, financial analysis, and carbon impact reporting.",
  openGraph: {
    title: "GeoSense — AI Geothermal Intelligence",
    description: "Discover the geothermal potential beneath any property in seconds. AI-powered system recommendations, financial analysis, and carbon impact reporting.",
    type: "website",
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="/images/geothermal-diagram.png" as="image" />
      </head>
      <body className="antialiased text-slate-900 bg-slate-50">
        {children}
      </body>
    </html>
  );
}
