"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Monitor, BarChart3, Settings } from "lucide-react"
import { AdminDashboard } from "@/components/admin-dashboard"
import { ClientWaitingScreen } from "@/components/client-waiting-screen"
import { DailyReports } from "@/components/daily-reports"
import Image from "next/image"

type ViewMode = "admin" | "client" | "reports" | "home"

export default function HomePage() {
  const [currentView, setCurrentView] = useState<ViewMode>("home")

  if (currentView === "admin") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setCurrentView("home")} className="mb-4">
              ← Volver al inicio
            </Button>
          </div>
          <AdminDashboard />
        </div>
      </div>
    )
  }

  if (currentView === "client") {
    return (
      <div className="min-h-screen">
        <div className="fixed top-4 left-4 z-40">
          <Button variant="outline" onClick={() => setCurrentView("home")} size="sm">
            ← Inicio
          </Button>
        </div>
        <ClientWaitingScreen />
      </div>
    )
  }

  if (currentView === "reports") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setCurrentView("home")} className="mb-4">
              ← Volver al inicio
            </Button>
          </div>
          <DailyReports />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-accent text-accent-foreground shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="MY Logo" width={120} height={80} className="object-contain" />
            <div>
              <h1 className="text-2xl font-bold">Sistema de Gestión de Turnos</h1>
              <p className="text-accent-foreground/80">Gestión profesional de servicios y clientes</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Selecciona el módulo que deseas usar</h2>
          <p className="text-muted-foreground text-lg">
            Sistema completo para gestión de turnos, servicios de impresión digital, corte y laminado
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
            onClick={() => setCurrentView("admin")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Dashboard Administrativo</CardTitle>
              <CardDescription>Gestión de tickets, asignación de servicios y control de tiempos</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Crear y gestionar tickets</li>
                <li>• Asignar tiempos de servicio</li>
                <li>• Control de trabajadores</li>
                <li>• Gestión de contraseñas</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
            onClick={() => setCurrentView("client")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <Monitor className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Pantalla de Espera</CardTitle>
              <CardDescription>Display para clientes con turnos en progreso y próximos</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Turnos en tiempo real</li>
                <li>• Notificaciones visuales</li>
                <li>• Lista de espera</li>
                <li>• Llamadas a clientes</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary md:col-span-2 lg:col-span-1"
            onClick={() => setCurrentView("reports")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Panel de Reportes</CardTitle>
              <CardDescription>Reportes diarios y estadísticas de rendimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Clientes atendidos</li>
                <li>• Tiempos de servicio</li>
                <li>• Reportes diarios</li>
                <li>• Análisis de rendimiento</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Services Info */}
        <div className="mt-16 bg-card rounded-lg p-8">
          <h3 className="text-2xl font-bold text-center text-card-foreground mb-8">Servicios Disponibles</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Settings className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold text-card-foreground mb-2">Impresión Digital</h4>
              <p className="text-sm text-muted-foreground">Servicio de impresión digital de alta calidad</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Settings className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold text-card-foreground mb-2">Corte</h4>
              <p className="text-sm text-muted-foreground">Servicios de corte profesional y preciso</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Settings className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold text-card-foreground mb-2">Laminado</h4>
              <p className="text-sm text-muted-foreground">Laminado profesional para protección de documentos</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
