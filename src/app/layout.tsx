import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { SessionTimeout } from "@/components/SessionTimeout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Alpha Energy | Multi-Station Fuel Management",
  description: "Super modern multi-station fuel management system with M-Pesa integration, real-time analytics, and advanced reporting.",
  keywords: ["fuel station", "energy", "M-Pesa", "Kenya", "petroleum", "management"],
  authors: [{ name: "Jimhawkins Korir" }],
  openGraph: {
    title: "Alpha Energy",
    description: "Multi-Station Fuel Management System",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <meta name="theme-color" content="#3B82F6" />
      </head>
      <body className={inter.className}>
        <SessionTimeout />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}