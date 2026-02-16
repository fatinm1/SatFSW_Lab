import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SATFSW Lab | Mission Control",
  description: "Satellite Flight Software Lab - Mission Control Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
