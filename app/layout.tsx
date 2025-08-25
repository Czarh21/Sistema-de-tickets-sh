import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { TicketProvider } from "@/lib/ticket-context"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sistema de Gestión de Turnos",
  description: "Sistema profesional para gestión de turnos y servicios",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <TicketProvider>{children}</TicketProvider>
      </body>
    </html>
  )
}
