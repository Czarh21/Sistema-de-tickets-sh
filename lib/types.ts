export type ServiceType = "impresion-digital" | "corte" | "laminado"

export interface ServiceStatus {
  service: ServiceType
  isCompleted: boolean
  completedAt?: Date
  completedBy?: string
}

export interface Ticket {
  id: string
  ticketNumber: number
  customerName: string
  service: ServiceType
  services?: ServiceType[]
  serviceStatuses?: ServiceStatus[]
  estimatedTime: number
  status: "waiting" | "in-progress" | "completed"
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  isCalling: boolean
  notes?: string
  posTicketNumber?: string
}

export interface DailyReport {
  date: string
  totalTickets: number
  completedOnTime: number
  overdue: number
  tickets: Ticket[]
}

export interface ServiceConfig {
  name: string
  defaultTime: number
  enabled: boolean
}

export interface ServiceSettings {
  [key: string]: ServiceConfig
}

export interface SystemState {
  tickets: Ticket[]
  currentTicketNumber: number
  managerPassword: string
  dailyReports: DailyReport[]
  serviceSettings: ServiceSettings
}
