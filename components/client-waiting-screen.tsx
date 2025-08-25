"use client"

import { useEffect, useState } from "react"
import { useTickets } from "@/lib/ticket-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User, Settings, Phone, Bell } from "lucide-react"
import Image from "next/image"
import type { Ticket } from "@/lib/types"

export function ClientWaitingScreen() {
  const { state, clearCalling, getServiceLabel } = useTickets()
  const [currentTime, setCurrentTime] = useState(new Date())
  const waitingTickets = state.tickets.filter((ticket) => ticket.status === "waiting")
  const inProgressTickets = state.tickets.filter((ticket) => ticket.status === "in-progress")
  const callingTicket = state.tickets.find((ticket) => ticket.isCalling)

  // Actualizar la hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (callingTicket) {
      console.log("[v0] Setting timeout for calling ticket:", callingTicket.id)
      const timer = setTimeout(() => {
        console.log("[v0] Clearing calling notification for ticket:", callingTicket.id)
        clearCalling(callingTicket.id)
      }, 10000) // 10 seconds

      return () => {
        console.log("[v0] Cleaning up timeout")
        clearTimeout(timer)
      }
    }
  }, [callingTicket]) // Updated dependency array

  const getWaitTime = (ticket: Ticket) => {
    const now = new Date()
    const waitingMinutes = Math.floor((now.getTime() - ticket.createdAt.getTime()) / (1000 * 60))
    return waitingMinutes
  }

  const getEstimatedWaitTime = (ticketIndex: number) => {
    // Calcular tiempo estimado basado en tickets anteriores
    let totalWaitTime = 0
    for (let i = 0; i < ticketIndex; i++) {
      totalWaitTime += waitingTickets[i]?.estimatedTime || 0
    }
    // Agregar tiempo de tickets en proceso
    inProgressTickets.forEach((ticket) => {
      if (ticket.startedAt) {
        const elapsedMinutes = (new Date().getTime() - ticket.startedAt.getTime()) / (1000 * 60)
        const remainingTime = Math.max(0, ticket.estimatedTime - elapsedMinutes)
        totalWaitTime += remainingTime
      }
    })
    return Math.ceil(totalWaitTime)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Image src="/logo.png" alt="MyApp Logo" width={120} height={90} className="object-contain" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-2">Sistema de Turnos</h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-4">
          Servicios de Impresión Digital, Corte y Laminado
        </p>
        <div className="text-lg md:text-xl text-accent font-semibold">
          {currentTime.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      </div>

      {/* Notificación de Llamada */}
      {callingTicket && (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-2xl mx-4 border-4 border-primary shadow-2xl animate-pulse">
            <CardContent className="p-12 text-center">
              <div className="mb-6">
                <Bell className="h-24 w-24 text-primary mx-auto animate-bounce" />
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-primary mb-4">¡SU TURNO!</h2>
              <div className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
                Ticket #{callingTicket.ticketNumber}
              </div>
              <div className="text-xl md:text-2xl text-muted-foreground mb-4">{callingTicket.customerName}</div>
              <div className="text-lg md:text-xl text-accent">Servicio: {getServiceLabel(callingTicket.service)}</div>
              <p className="text-base md:text-lg text-muted-foreground mt-6">
                Por favor diríjase al mostrador de atención
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Tickets en Proceso */}
        <Card className="h-fit">
          <CardHeader className="bg-accent text-accent-foreground">
            <CardTitle className="text-2xl md:text-3xl flex items-center gap-3">
              <Settings className="h-8 w-8" />
              Atendiendo Ahora ({inProgressTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {inProgressTickets.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl text-muted-foreground">No hay servicios en proceso</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inProgressTickets.map((ticket) => {
                  const elapsedMinutes = ticket.startedAt
                    ? Math.floor((new Date().getTime() - ticket.startedAt.getTime()) / (1000 * 60))
                    : 0
                  const remainingTime = Math.max(0, ticket.estimatedTime - elapsedMinutes)
                  const isOverdue = elapsedMinutes > ticket.estimatedTime

                  return (
                    <div
                      key={ticket.id}
                      className={`border-2 rounded-lg p-6 hover:shadow-lg transition-shadow ${
                        isOverdue ? "bg-red-50 border-red-300" : "bg-primary/5 border-primary/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`text-3xl font-bold ${isOverdue ? "text-red-600" : "text-primary"}`}>
                            #{ticket.ticketNumber}
                          </div>
                          <Badge
                            className={`text-sm px-3 py-1 ${
                              isOverdue ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"
                            }`}
                          >
                            {isOverdue ? "Excedido" : "En Proceso"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {isOverdue ? "Tiempo excedido" : "Tiempo restante"}
                          </div>
                          <div className={`text-2xl font-bold ${isOverdue ? "text-red-600" : "text-accent"}`}>
                            {isOverdue ? `+${elapsedMinutes - ticket.estimatedTime} min` : `${remainingTime} min`}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Cliente</p>
                          <p className="font-semibold text-lg">{ticket.customerName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Servicio</p>
                          <p className="font-semibold text-lg">{getServiceLabel(ticket.service)}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Iniciado:{" "}
                          {ticket.startedAt?.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>
                          Estimado: {ticket.estimatedTime} min • Transcurrido: {elapsedMinutes} min
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cola de Espera */}
        <Card className="h-fit">
          <CardHeader className="bg-secondary text-secondary-foreground">
            <CardTitle className="text-2xl md:text-3xl flex items-center gap-3">
              <User className="h-8 w-8" />
              Cola de Espera ({waitingTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {waitingTickets.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl text-muted-foreground">No hay clientes en espera</p>
                <p className="text-lg text-muted-foreground mt-2">¡Puede ser atendido de inmediato!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {waitingTickets.slice(0, 8).map((ticket, index) => {
                  const waitTime = getWaitTime(ticket)
                  const estimatedWaitTime = getEstimatedWaitTime(index)

                  return (
                    <div
                      key={ticket.id}
                      className={`border rounded-lg p-4 transition-all ${
                        index === 0 ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`text-2xl font-bold ${index === 0 ? "text-primary" : "text-foreground"}`}>
                            #{ticket.ticketNumber}
                          </div>
                          {index === 0 && <Badge className="bg-primary text-primary-foreground">Próximo</Badge>}
                          {index === 1 && <Badge variant="secondary">Siguiente</Badge>}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Tiempo estimado</div>
                          <div className="text-lg font-bold text-accent">
                            {index === 0 ? "Próximo" : `~${estimatedWaitTime} min`}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Cliente</p>
                          <p className="font-medium">{ticket.customerName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Servicio</p>
                          <p className="font-medium">{getServiceLabel(ticket.service)}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Esperando: {waitTime} min</span>
                        <span>Duración: {ticket.estimatedTime} min</span>
                      </div>
                    </div>
                  )
                })}

                {waitingTickets.length > 8 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Y {waitingTickets.length - 8} tickets más en cola...</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer con información */}
      <div className="mt-12 text-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="bg-card/50">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-lg mb-1">Horario de Atención</h3>
              <p className="text-muted-foreground">Lunes a Viernes: 8:00 AM - 6:00 PM</p>
              <p className="text-muted-foreground">Sábados: 9:00 AM - 2:00 PM</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-6 text-center">
              <Settings className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-lg mb-1">Servicios</h3>
              <p className="text-muted-foreground">Impresión Digital</p>
              <p className="text-muted-foreground">Corte • Laminado</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-6 text-center">
              <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-lg mb-1">Contacto</h3>
              <p className="text-muted-foreground">¿Preguntas?</p>
              <p className="text-muted-foreground">Acércate al mostrador</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-muted-foreground">
          <p className="text-lg">Gracias por su paciencia y preferencia</p>
          <p className="text-sm mt-2">Los tiempos son estimados y pueden variar según la complejidad del servicio</p>
        </div>
      </div>
    </div>
  )
}
