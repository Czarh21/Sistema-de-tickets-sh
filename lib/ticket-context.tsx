"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { Ticket, ServiceType, SystemState, DailyReport, ServiceSettings, ServiceStatus } from "./types"

interface TicketContextType {
  state: SystemState
  createTicket: (
    customerName: string,
    services: ServiceType[],
    customTime?: number,
    notes?: string,
    posTicketNumber?: string,
  ) => Ticket
  startTicket: (ticketId: string) => void
  completeTicket: (ticketId: string) => void
  completeService: (ticketId: string, service: ServiceType, completedBy: string) => void
  callCustomer: (ticketId: string) => void
  clearCalling: (ticketId: string) => void
  updateEstimatedTime: (ticketId: string, newTime: number, password: string) => boolean
  generateDailyReport: () => DailyReport
  printTicket: (ticket: Ticket) => void
  getTicketById: (ticketId: string) => Ticket | undefined
  updateServiceSettings: (settings: ServiceSettings, password: string) => boolean
  calculateTotalTime: (services: ServiceType[]) => number
  getServiceLabel: (service: ServiceType) => string
}

type TicketAction =
  | {
      type: "CREATE_TICKET"
      payload: {
        customerName: string
        services: ServiceType[]
        estimatedTime: number
        notes?: string
        posTicketNumber?: string
      }
    }
  | { type: "START_TICKET"; payload: string }
  | { type: "COMPLETE_TICKET"; payload: string }
  | { type: "COMPLETE_SERVICE"; payload: { ticketId: string; service: ServiceType; completedBy: string } }
  | { type: "CALL_CUSTOMER"; payload: string }
  | { type: "CLEAR_CALLING"; payload: string }
  | { type: "UPDATE_TIME"; payload: { ticketId: string; newTime: number } }
  | { type: "UPDATE_SERVICE_SETTINGS"; payload: ServiceSettings }
  | { type: "LOAD_STATE"; payload: SystemState }

const defaultServiceSettings: ServiceSettings = {
  "impresion-digital": {
    name: "Impresión Digital",
    defaultTime: 0, // Sin tiempo predefinido para permitir personalización completa
    enabled: true,
  },
  corte: {
    name: "Corte",
    defaultTime: 0, // Sin tiempo predefinido para permitir personalización completa
    enabled: true,
  },
  laminado: {
    name: "Laminado",
    defaultTime: 0, // Sin tiempo predefinido para permitir personalización completa
    enabled: true,
  },
}

const initialState: SystemState = {
  tickets: [],
  currentTicketNumber: 1,
  managerPassword: "admin123", // En producción esto debería estar encriptado
  dailyReports: [],
  serviceSettings: defaultServiceSettings,
}

function ticketReducer(state: SystemState, action: TicketAction): SystemState {
  switch (action.type) {
    case "CREATE_TICKET": {
      const serviceStatuses: ServiceStatus[] = action.payload.services.map((service) => ({
        service,
        isCompleted: false,
      }))

      const newTicket: Ticket = {
        id: Date.now().toString(),
        ticketNumber: state.currentTicketNumber,
        customerName: action.payload.customerName,
        service: action.payload.services[0], // Mantener compatibilidad
        services: action.payload.services, // Agregando servicios múltiples
        serviceStatuses, // Adding service status tracking
        estimatedTime: action.payload.estimatedTime,
        status: "waiting",
        createdAt: new Date(),
        isCalling: false,
        notes: action.payload.notes,
        posTicketNumber: action.payload.posTicketNumber,
      }

      return {
        ...state,
        tickets: [...state.tickets, newTicket],
        currentTicketNumber: state.currentTicketNumber + 1,
      }
    }

    case "COMPLETE_SERVICE": {
      return {
        ...state,
        tickets: state.tickets.map((ticket) => {
          if (ticket.id === action.payload.ticketId) {
            const updatedServiceStatuses =
              ticket.serviceStatuses?.map((status) =>
                status.service === action.payload.service
                  ? { ...status, isCompleted: true, completedAt: new Date(), completedBy: action.payload.completedBy }
                  : status,
              ) || []

            const allServicesCompleted = updatedServiceStatuses.every((status) => status.isCompleted)

            return {
              ...ticket,
              serviceStatuses: updatedServiceStatuses,
              status: allServicesCompleted ? ("completed" as const) : ticket.status,
              completedAt: allServicesCompleted ? new Date() : ticket.completedAt,
            }
          }
          return ticket
        }),
      }
    }

    case "START_TICKET": {
      return {
        ...state,
        tickets: state.tickets.map((ticket) =>
          ticket.id === action.payload
            ? { ...ticket, status: "in-progress" as const, startedAt: new Date(), isCalling: false }
            : ticket,
        ),
      }
    }

    case "COMPLETE_TICKET": {
      return {
        ...state,
        tickets: state.tickets.map((ticket) =>
          ticket.id === action.payload ? { ...ticket, status: "completed" as const, completedAt: new Date() } : ticket,
        ),
      }
    }

    case "CALL_CUSTOMER": {
      return {
        ...state,
        tickets: state.tickets.map((ticket) =>
          ticket.id === action.payload ? { ...ticket, isCalling: true } : { ...ticket, isCalling: false },
        ),
      }
    }

    case "CLEAR_CALLING": {
      return {
        ...state,
        tickets: state.tickets.map((ticket) =>
          ticket.id === action.payload ? { ...ticket, isCalling: false } : ticket,
        ),
      }
    }

    case "UPDATE_TIME": {
      return {
        ...state,
        tickets: state.tickets.map((ticket) =>
          ticket.id === action.payload.ticketId ? { ...ticket, estimatedTime: action.payload.newTime } : ticket,
        ),
      }
    }

    case "LOAD_STATE": {
      const updatedTickets = action.payload.tickets.map((ticket: any) => {
        if (!ticket.serviceStatuses && ticket.services) {
          return {
            ...ticket,
            serviceStatuses: ticket.services.map((service) => ({
              service,
              isCompleted: ticket.status === "completed",
              completedAt: ticket.status === "completed" ? ticket.completedAt : undefined,
            })),
          }
        }
        return ticket
      })

      return {
        ...action.payload,
        tickets: updatedTickets,
        serviceSettings: action.payload.serviceSettings || defaultServiceSettings,
      }
    }

    default:
      return state
  }
}

const TicketContext = createContext<TicketContextType | undefined>(undefined)

export function TicketProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(ticketReducer, initialState)

  useEffect(() => {
    const savedState = localStorage.getItem("ticket-system-state")
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        parsedState.tickets = parsedState.tickets.map((ticket: any) => ({
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          startedAt: ticket.startedAt ? new Date(ticket.startedAt) : undefined,
          completedAt: ticket.completedAt ? new Date(ticket.completedAt) : undefined,
        }))
        dispatch({ type: "LOAD_STATE", payload: parsedState })
      } catch (error) {
        console.error("Error loading saved state:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("ticket-system-state", JSON.stringify(state))
  }, [state])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      state.tickets.forEach((ticket) => {
        if (ticket.status === "in-progress" && ticket.startedAt) {
          const elapsedMinutes = (now.getTime() - ticket.startedAt.getTime()) / (1000 * 60)
          if (elapsedMinutes > ticket.estimatedTime && ticket.status !== "overdue") {
            dispatch({ type: "UPDATE_TIME", payload: { ticketId: ticket.id, newTime: ticket.estimatedTime } })
          }
        }
      })
    }, 60000)

    return () => clearInterval(interval)
  }, [state.tickets])

  const createTicket = (
    customerName: string,
    services: ServiceType[],
    customTime?: number,
    notes?: string,
    posTicketNumber?: string,
  ): Ticket => {
    const calculatedTime = customTime !== undefined ? customTime : calculateTotalTime(services)

    const newTicket: Ticket = {
      id: Date.now().toString(),
      ticketNumber: state.currentTicketNumber,
      customerName: customerName.trim(),
      service: services[0], // Mantener compatibilidad
      services,
      estimatedTime: calculatedTime,
      status: "waiting",
      createdAt: new Date(),
      isCalling: false,
      notes: notes?.trim() || undefined,
      posTicketNumber: posTicketNumber?.trim() || undefined,
    }

    dispatch({
      type: "CREATE_TICKET",
      payload: {
        customerName,
        services,
        estimatedTime: calculatedTime,
        notes: notes?.trim(),
        posTicketNumber: posTicketNumber?.trim(),
      },
    })
    return newTicket
  }

  const calculateTotalTime = (services: ServiceType[]): number => {
    const total = services.reduce((total, service) => {
      const serviceConfig = state.serviceSettings[service]
      return total + (serviceConfig?.defaultTime || 0)
    }, 0)

    return total > 0 ? total : 15 // 15 minutos por defecto si no hay tiempos configurados
  }

  const updateServiceSettings = (settings: ServiceSettings, password: string): boolean => {
    if (password !== state.managerPassword) {
      return false
    }
    dispatch({ type: "UPDATE_SERVICE_SETTINGS", payload: settings })
    return true
  }

  const getServiceLabel = (service: ServiceType): string => {
    return state.serviceSettings[service]?.name || service.toUpperCase()
  }

  const startTicket = (ticketId: string) => {
    dispatch({ type: "START_TICKET", payload: ticketId })
  }

  const completeTicket = (ticketId: string) => {
    dispatch({ type: "COMPLETE_TICKET", payload: ticketId })
  }

  const callCustomer = (ticketId: string) => {
    dispatch({ type: "CALL_CUSTOMER", payload: ticketId })
  }

  const clearCalling = (ticketId: string) => {
    dispatch({ type: "CLEAR_CALLING", payload: ticketId })
  }

  const updateEstimatedTime = (ticketId: string, newTime: number, password: string): boolean => {
    if (password !== state.managerPassword) {
      return false
    }
    dispatch({ type: "UPDATE_TIME", payload: { ticketId, newTime } })
    return true
  }

  const generateDailyReport = (): DailyReport => {
    const today = new Date().toDateString()
    const todayTickets = state.tickets.filter((ticket) => ticket.createdAt.toDateString() === today)

    const completedOnTime = todayTickets.filter((ticket) => {
      if (ticket.status !== "completed" || !ticket.startedAt || !ticket.completedAt) return false
      const actualTime = (ticket.completedAt.getTime() - ticket.startedAt.getTime()) / (1000 * 60)
      return actualTime <= ticket.estimatedTime
    }).length

    const overdue = todayTickets.filter((ticket) => {
      if (ticket.status !== "completed" || !ticket.startedAt || !ticket.completedAt) return false
      const actualTime = (ticket.completedAt.getTime() - ticket.startedAt.getTime()) / (1000 * 60)
      return actualTime > ticket.estimatedTime
    }).length

    return {
      date: today,
      totalTickets: todayTickets.length,
      completedOnTime,
      overdue,
      tickets: todayTickets,
    }
  }

  const printTicket = (ticket: Ticket) => {
    try {
      const getServicesText = (ticket: Ticket) => {
        if (ticket.services && ticket.services.length > 1) {
          return ticket.services.map((service) => getServiceLabel(service)).join(" + ")
        }
        return getServiceLabel(ticket.service)
      }

      const printContent = `
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
              @media print {
                body { margin: 0; padding: 10px; }
                .ticket { border: 2px dashed #000; }
              }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <img src="/logo.png" alt="MyApp Logo" style="height: 40px; margin-bottom: 10px;">
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
                ${
                  ticket.posTicketNumber
                    ? `
                <div class="info-row">
                  <span class="label">POS:</span>
                  <span class="value">${ticket.posTicketNumber}</span>
                </div>
                `
                    : ""
                }
                <div class="info-row">
                  <span class="label">SERVICIO(S):</span>
                  <span class="value">${getServicesText(ticket)}</span>
                </div>
                <div class="info-row">
                  <span class="label">TIEMPO EST.:</span>
                  <span class="value">${ticket.estimatedTime > 0 ? ticket.estimatedTime + " MINUTOS" : "SIN TIEMPO ASIGNADO"}</span>
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
                ${
                  ticket.notes
                    ? `
                <div style="border-top: 1px solid #ccc; padding-top: 8px; margin-top: 8px;">
                  <div class="info-row">
                    <span class="label">NOTAS:</span>
                  </div>
                  <p style="font-size: 10px; text-align: left; margin: 5px 0; word-wrap: break-word;">${ticket.notes}</p>
                </div>
                `
                    : ""
                }
              </div>

              <div>
                <p class="label">ESTADO ACTUAL</p>
                <p style="font-weight: bold; font-size: 14px; margin: 10px 0;">EN ESPERA</p>
              </div>

              <div style="border-top: 1px solid #666; padding-top: 10px; margin-top: 10px;">
                <p style="font-size: 10px; color: #666; margin: 5px 0;">Por favor conserve este ticket hasta ser atendido</p>
                <p style="font-size: 10px; color: #666; margin: 5px 0;">Los tiempos son estimados y pueden variar</p>
                <p style="font-weight: bold; font-size: 11px; margin: 10px 0;">¡GRACIAS POR SU PREFERENCIA!</p>
              </div>

              <div class="footer">
                <p>Sistema de Gestión de Turnos v1.0</p>
              </div>
            </div>
          </body>
        </html>
      `

      console.log("IMPRIMIENDO TICKET:", ticket)

      const printWindow = window.open("", "_blank", "width=400,height=600")
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.onload = () => {
          printWindow.print()
          printWindow.onafterprint = () => {
            printWindow.close()
          }
        }
      } else {
        console.error("No se pudo abrir la ventana de impresión")
      }
    } catch (error) {
      console.error("Error al imprimir ticket:", error)
    }
  }

  const getTicketById = (ticketId: string): Ticket | undefined => {
    return state.tickets.find((ticket) => ticket.id === ticketId)
  }

  const completeService = (ticketId: string, service: ServiceType, completedBy: string) => {
    dispatch({ type: "COMPLETE_SERVICE", payload: { ticketId, service, completedBy } })
  }

  return (
    <TicketContext.Provider
      value={{
        state,
        createTicket,
        startTicket,
        completeTicket,
        completeService,
        callCustomer,
        clearCalling,
        updateEstimatedTime,
        generateDailyReport,
        printTicket,
        getTicketById,
        updateServiceSettings,
        calculateTotalTime,
        getServiceLabel,
      }}
    >
      {children}
    </TicketContext.Provider>
  )
}

export function useTickets() {
  const context = useContext(TicketContext)
  if (context === undefined) {
    throw new Error("useTickets must be used within a TicketProvider")
  }
  return context
}
