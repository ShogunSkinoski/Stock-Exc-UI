import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ViewTransitions } from "next-view-transitions"
import { ThemeProvider } from "@/components/ui/theme-provider"
import Footer from "@/components/ui/footer"
import Navigation from "@/components/ui/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TakasKafka",
  description:
    "",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ViewTransitions>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.className} min-h-screen bg-background pb-6 antialiased selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navigation/>
            <main className="container">{children}</main>
            <Footer />
          </ThemeProvider>
        </body>
      </html>
    </ViewTransitions>
  )
}
