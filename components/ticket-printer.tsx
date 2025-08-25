"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Printer, Eye, Download, CheckCircle } from "lucide-react"
import { TicketPreview } from "./ticket-preview"
import { useTickets } from "@/lib/ticket-context"
import type { Ticket } from "@/lib/types"

interface TicketPrinterProps {
  ticket: Ticket
  onPrintComplete?: () => void
}

export function TicketPrinter({ ticket, onPrintComplete }: TicketPrinterProps) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [printSuccess, setPrintSuccess] = useState(false)
  const { getServiceLabel } = useTickets()

  const handlePrint = async () => {
    setIsPrinting(true)

    try {
      // Crear contenido del ticket para impresión
      const printContent = generatePrintContent(ticket, getServiceLabel)

      // Crear ventana de impresión
      const printWindow = window.open("", "_blank", "width=400,height=600")
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()

        // Esperar a que se cargue y luego imprimir
        printWindow.onload = () => {
          printWindow.print()
          printWindow.onafterprint = () => {
            printWindow.close()
            setPrintSuccess(true)
            onPrintComplete?.()
            setTimeout(() => setPrintSuccess(false), 3000)
          }
        }
      }
    } catch (error) {
      console.error("Error al imprimir:", error)
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDownloadPDF = () => {
    // Simular descarga de PDF (en producción se implementaría con una librería como jsPDF)
    const element = document.createElement("a")
    const content = `Ticket #${ticket.ticketNumber}\nCliente: ${ticket.customerName}\nServicio: ${ticket.service}\nTiempo: ${ticket.estimatedTime} min\nFecha: ${ticket.createdAt.toLocaleString()}`
    const file = new Blob([content], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `ticket-${ticket.ticketNumber}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Ticket #{ticket.ticketNumber}
        </CardTitle>
        <CardDescription>Cliente: {ticket.customerName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={handlePrint} disabled={isPrinting} className="gap-2">
            <Printer className="h-4 w-4" />
            {isPrinting ? "Imprimiendo..." : "Imprimir"}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Eye className="h-4 w-4" />
                Vista Previa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Vista Previa del Ticket</DialogTitle>
                <DialogDescription>Así se verá el ticket impreso</DialogDescription>
              </DialogHeader>
              <TicketPreview ticket={ticket} onPrint={handlePrint} showPrintButton={false} />
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleDownloadPDF} className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Descargar
          </Button>
        </div>

        {printSuccess && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Ticket impreso correctamente</span>
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Servicio: {getServiceLabel(ticket.service)}</p>
          <p>• Tiempo estimado: {ticket.estimatedTime} minutos</p>
          <p>• Creado: {ticket.createdAt.toLocaleString()}</p>
          <p>• Estado: {ticket.status.toUpperCase()}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function generatePrintContent(ticket: Ticket, getServiceLabel: (service: string) => string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ticket #${ticket.ticketNumber}</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 20px;
            width: 300px;
            background: white;
            color: black;
          }
          .ticket {
            border: 2px dashed #333;
            padding: 15px;
            text-align: center;
          }
          .header {
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .ticket-number {
            font-size: 32px;
            font-weight: bold;
            border: 2px solid #333;
            padding: 10px;
            margin: 10px 0;
            display: inline-block;
          }
          .info-section {
            border-top: 1px solid #666;
            border-bottom: 1px solid #666;
            padding: 10px 0;
            margin: 10px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .label {
            font-size: 10px;
            color: #666;
          }
          .value {
            font-weight: bold;
            text-align: right;
          }
          .footer {
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 15px;
            font-size: 10px;
            color: #666;
          }
          .status {
            font-weight: bold;
            font-size: 14px;
            margin: 10px 0;
          }
          .notes {
            font-size: 10px;
            color: #666;
            margin: 5px 0;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .ticket { border: 2px dashed #000; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1 style="margin: 0; font-size: 16px;">SISTEMA DE TURNOS</h1>
            <p style="margin: 5px 0 0 0; font-size: 10px;">Servicios Profesionales</p>
          </div>

          <div>
            <p class="label">TICKET NÚMERO</p>
            <div class="ticket-number">${ticket.ticketNumber.toString().padStart(3, "0")}</div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="label">CLIENTE:</span>
              <span class="value">${ticket.customerName.toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="label">SERVICIO:</span>
              <span class="value">${getServiceLabel(ticket.service).toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="label">TIEMPO EST.:</span>
              <span class="value">${ticket.estimatedTime} MINUTOS</span>
            </div>
            <div class="info-row">
              <span class="label">FECHA:</span>
              <span class="value">${ticket.createdAt.toLocaleDateString("es-ES")}</span>
            </div>
            <div class="info-row">
              <span class="label">HORA:</span>
              <span class="value">${ticket.createdAt.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}</span>
            </div>
          </div>

          <div>
            <p class="label">ESTADO ACTUAL</p>
            <p class="status">
              ${
                ticket.status === "waiting"
                  ? "EN ESPERA"
                  : ticket.status === "in-progress"
                    ? "EN PROCESO"
                    : "COMPLETADO"
              }
            </p>
          </div>

          <div style="border-top: 1px solid #666; padding-top: 10px; margin-top: 10px;">
            <p class="notes">Por favor conserve este ticket hasta ser atendido</p>
            <p class="notes">Los tiempos son estimados y pueden variar</p>
            <p style="font-weight: bold; font-size: 11px; margin: 10px 0;">¡GRACIAS POR SU PREFERENCIA!</p>
          </div>

          <div class="footer">
            <p>Sistema de Gestión de Turnos v1.0</p>
          </div>
        </div>
      </body>
    </html>
  `
}
