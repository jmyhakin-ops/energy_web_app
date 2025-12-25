import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Energy Station Manager | Multi-Station Fuel Management",
  description: "Super modern multi-station fuel management system with M-Pesa integration, real-time analytics, and advanced reporting.",
  keywords: ["fuel station", "energy", "M-Pesa", "Kenya", "petroleum", "management"],
  authors: [{ name: "Energy Solutions Ltd" }],
  openGraph: {
    title: "Energy Station Manager",
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
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#8B5CF6" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
