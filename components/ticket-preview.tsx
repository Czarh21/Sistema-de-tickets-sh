"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import Image from "next/image"
import { useTickets } from "@/lib/ticket-context"
import type { Ticket } from "@/lib/types"

interface TicketPreviewProps {
  ticket: Ticket
  onPrint?: () => void
  showPrintButton?: boolean
}

export function TicketPreview({ ticket, onPrint, showPrintButton = true }: TicketPreviewProps) {
  const { getServiceLabel } = useTickets()

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      {showPrintButton && (
        <div className="flex gap-2">
          <Button onClick={onPrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir Ticket
          </Button>
        </div>
      )}

      {/* Vista previa del ticket */}
      <Card className="w-full max-w-sm mx-auto bg-white text-black border-2 border-dashed border-gray-400">
        <CardContent className="p-6 font-mono text-sm">
          <div className="text-center space-y-2">
            <div className="border-b-2 border-black pb-2 mb-4">
              <div className="flex justify-center mb-2">
                <Image src="/logo.png" alt="MyApp Logo" width={60} height={45} className="object-contain" />
              </div>
              <h1 className="text-lg font-bold">SISTEMA DE TURNOS</h1>
              <p className="text-xs">Servicios Profesionales</p>
            </div>

            <div className="space-y-3">
              <div className="text-center">
                <p className="text-xs text-gray-600">TICKET NÚMERO</p>
                <p className="text-4xl font-bold border-2 border-black py-2 px-4 inline-block">
                  {ticket.ticketNumber.toString().padStart(3, "0")}
                </p>
              </div>

              <div className="border-t border-b border-gray-400 py-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">CLIENTE:</span>
                  <span className="font-semibold text-right">{ticket.customerName.toUpperCase()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">SERVICIO:</span>
                  <span className="font-semibold text-right">{getServiceLabel(ticket.service).toUpperCase()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">TIEMPO EST.:</span>
                  <span className="font-semibold text-right">{ticket.estimatedTime} MINUTOS</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">FECHA:</span>
                  <span className="font-semibold text-right">{formatDate(ticket.createdAt)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">HORA:</span>
                  <span className="font-semibold text-right">{formatTime(ticket.createdAt)}</span>
                </div>
              </div>

              <div className="text-center space-y-2 pt-2">
                <p className="text-xs text-gray-600">ESTADO ACTUAL</p>
                <p className="font-bold text-sm">
                  {ticket.status === "waiting" && "EN ESPERA"}
                  {ticket.status === "in-progress" && "EN PROCESO"}
                  {ticket.status === "completed" && "COMPLETADO"}
                </p>
              </div>

              <div className="border-t border-gray-400 pt-3 space-y-1">
                <p className="text-xs text-center text-gray-600">Por favor conserve este ticket hasta ser atendido</p>
                <p className="text-xs text-center text-gray-600">Los tiempos son estimados y pueden variar</p>
                <p className="text-xs text-center font-semibold">¡GRACIAS POR SU PREFERENCIA!</p>
              </div>

              <div className="border-t-2 border-black pt-2">
                <p className="text-xs text-center text-gray-600">Sistema de Gestión de Turnos v1.0</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
