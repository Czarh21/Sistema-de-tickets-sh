"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Play, CheckCircle, Phone, Clock, User, Printer, Settings } from "lucide-react"
import { useTickets } from "@/lib/ticket-context"
import { TicketPrinter } from "./ticket-printer"
import { ServiceSettingsDialog } from "./service-settings-dialog"
import Image from "next/image"
import type { ServiceType } from "@/lib/types"

export function AdminDashboard() {
  const {
    state,
    createTicket,
    startTicket,
    completeTicket,
    callCustomer,
    updateEstimatedTime,
    getServiceLabel,
    calculateTotalTime,
  } = useTickets()

  const [newTicketName, setNewTicketName] = useState("")
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([])
  const [serviceCustomTimes, setServiceCustomTimes] = useState<Record<ServiceType, number>>(
    {} as Record<ServiceType, number>,
  )
  const [ticketNotes, setTicketNotes] = useState("")
  const [posTicketNumber, setPosTicketNumber] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [timeUpdatePassword, setTimeUpdatePassword] = useState("")
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null)
  const [newTime, setNewTime] = useState<number>(0)

  const waitingTickets = state.tickets.filter((ticket) => ticket.status === "waiting")
  const inProgressTickets = state.tickets.filter((ticket) => ticket.status === "in-progress")
  const completedTickets = state.tickets.filter((ticket) => ticket.status === "completed")

  const calculateCustomTotalTime = () => {
    return selectedServices.reduce((total, service) => {
      const customTime = serviceCustomTimes[service]
      if (customTime !== undefined && customTime > 0) {
        return total + customTime
      }
      const defaultTime = state.serviceSettings[service]?.defaultTime || 15
      return total + defaultTime
    }, 0)
  }

  const handleCreateTicket = () => {
    if (!newTicketName.trim() || selectedServices.length === 0) return

    const hasCustomTimes = selectedServices.some((service) => serviceCustomTimes[service] > 0)
    const finalTime = hasCustomTimes ? calculateCustomTotalTime() : undefined

    const ticket = createTicket(newTicketName, selectedServices, finalTime, ticketNotes, posTicketNumber)
    setNewTicketName("")
    setSelectedServices([])
    setServiceCustomTimes({} as Record<ServiceType, number>)
    setTicketNotes("")
    setPosTicketNumber("")
    setIsCreateDialogOpen(false)
  }

  const handleServiceToggle = (service: ServiceType, checked: boolean) => {
    if (checked) {
      setSelectedServices([...selectedServices, service])
    } else {
      setSelectedServices(selectedServices.filter((s) => s !== service))
      const newCustomTimes = { ...serviceCustomTimes }
      delete newCustomTimes[service]
      setServiceCustomTimes(newCustomTimes)
    }
  }

  const handleServiceTimeChange = (service: ServiceType, time: number) => {
    setServiceCustomTimes((prev) => ({
      ...prev,
      [service]: time,
    }))
  }

  const handleUpdateTime = (ticketId: string) => {
    const success = updateEstimatedTime(ticketId, newTime, timeUpdatePassword)
    if (success) {
      setUpdatingTicketId(null)
      setTimeUpdatePassword("")
      setNewTime(0)
    } else {
      alert("Contraseña incorrecta")
    }
  }

  const availableServices = Object.entries(state.serviceSettings)
    .filter(([_, config]) => config.enabled)
    .map(([key, config]) => ({ key: key as ServiceType, ...config }))

  const estimatedTotalTime = calculateCustomTotalTime()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="MY Logo" width={80} height={60} className="object-contain" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Administrativo</h1>
            <p className="text-muted-foreground">Gestión de tickets y servicios</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ServiceSettingsDialog />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Ticket</DialogTitle>
                <DialogDescription>Ingrese los datos del cliente y configure los servicios</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Nombre del Cliente</Label>
                  <Input
                    id="customerName"
                    value={newTicketName}
                    onChange={(e) => setNewTicketName(e.target.value)}
                    placeholder="Ingrese el nombre del cliente"
                  />
                </div>

                <div>
                  <Label htmlFor="posTicketNumber">Número de Ticket POS (Opcional)</Label>
                  <Input
                    id="posTicketNumber"
                    value={posTicketNumber}
                    onChange={(e) => setPosTicketNumber(e.target.value)}
                    placeholder="Ej: POS-001, 12345"
                  />
                </div>

                <div>
                  <Label>Servicios Requeridos</Label>
                  <div className="space-y-3 mt-2">
                    {availableServices.map((service) => (
                      <div key={service.key} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={service.key}
                            checked={selectedServices.includes(service.key)}
                            onCheckedChange={(checked) => handleServiceToggle(service.key, !!checked)}
                          />
                          <Label htmlFor={service.key} className="flex-1">
                            {service.name}
                            {service.defaultTime > 0 && (
                              <span className="text-muted-foreground ml-2">
                                ({service.defaultTime} min por defecto)
                              </span>
                            )}
                          </Label>
                        </div>
                        {selectedServices.includes(service.key) && (
                          <div className="ml-6">
                            <Label htmlFor={`time-${service.key}`} className="text-sm">
                              Tiempo personalizado (minutos)
                            </Label>
                            <Input
                              id={`time-${service.key}`}
                              type="number"
                              min="1"
                              max="300"
                              value={serviceCustomTimes[service.key] || ""}
                              onChange={(e) => handleServiceTimeChange(service.key, Number(e.target.value) || 0)}
                              placeholder={`Por defecto: ${service.defaultTime || 15} min`}
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="ticketNotes">Notas Adicionales (Opcional)</Label>
                  <Textarea
                    id="ticketNotes"
                    value={ticketNotes}
                    onChange={(e) => setTicketNotes(e.target.value)}
                    placeholder="Instrucciones especiales, detalles del trabajo, etc."
                    rows={3}
                  />
                </div>

                {selectedServices.length > 0 && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium">Tiempo estimado total: {estimatedTotalTime} minutos</p>
                    <p className="text-xs text-muted-foreground">
                      Servicios:{" "}
                      {selectedServices
                        .map((s) => {
                          const customTime = serviceCustomTimes[s]
                          const defaultTime = state.serviceSettings[s]?.defaultTime || 15
                          const time = customTime > 0 ? customTime : defaultTime
                          return `${getServiceLabel(s)} (${time}min)`
                        })
                        .join(" + ")}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateTicket}
                    disabled={!newTicketName.trim() || selectedServices.length === 0}
                  >
                    Crear Ticket
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">En Espera</p>
                <p className="text-2xl font-bold">{waitingTickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">En Proceso</p>
                <p className="text-2xl font-bold">{inProgressTickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completados Hoy</p>
                <p className="text-2xl font-bold">{completedTickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Próximo Ticket</p>
                <p className="text-2xl font-bold">#{state.currentTicketNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets en Proceso */}
      {inProgressTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Tickets en Proceso ({inProgressTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inProgressTickets.map((ticket) => {
                const elapsedMinutes = ticket.startedAt
                  ? Math.floor((new Date().getTime() - ticket.startedAt.getTime()) / (1000 * 60))
                  : 0
                const isOverdue = elapsedMinutes > ticket.estimatedTime

                return (
                  <div
                    key={ticket.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      isOverdue ? "bg-red-50 border-red-200" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${isOverdue ? "text-red-600" : ""}`}>
                        #{ticket.ticketNumber}
                      </div>
                      <div>
                        <p className="font-semibold">{ticket.customerName}</p>
                        <p className="text-sm text-muted-foreground">{getServiceLabel(ticket.service)}</p>
                        {ticket.posTicketNumber && (
                          <p className="text-xs text-blue-600">POS: {ticket.posTicketNumber}</p>
                        )}
                        {ticket.notes && <p className="text-xs text-muted-foreground">Notas: {ticket.notes}</p>}
                        <p className="text-xs text-muted-foreground">
                          Iniciado:{" "}
                          {ticket.startedAt?.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} •
                          Tiempo transcurrido: {elapsedMinutes} min de {ticket.estimatedTime} min
                          {isOverdue && (
                            <span className="text-red-600 font-semibold ml-2">
                              (¡EXCEDIDO POR {elapsedMinutes - ticket.estimatedTime} MIN!)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                            <Clock className="h-4 w-4" />
                            Ajustar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Ajustar Tiempo - Ticket en Proceso</DialogTitle>
                            <DialogDescription>
                              Ticket #{ticket.ticketNumber} - {ticket.customerName}
                              <br />
                              Tiempo transcurrido: {elapsedMinutes} min | Estimado: {ticket.estimatedTime} min
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Nuevo tiempo estimado total (minutos)</Label>
                              <Input
                                type="number"
                                min={elapsedMinutes}
                                value={newTime || ticket.estimatedTime}
                                onChange={(e) => setNewTime(Number(e.target.value))}
                                placeholder={`Mínimo: ${elapsedMinutes} min (tiempo ya transcurrido)`}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Tiempo adicional necesario:{" "}
                                {Math.max(0, (newTime || ticket.estimatedTime) - elapsedMinutes)} min
                              </p>
                            </div>
                            <div>
                              <Label>Contraseña de Gerente</Label>
                              <Input
                                type="password"
                                value={timeUpdatePassword}
                                onChange={(e) => setTimeUpdatePassword(e.target.value)}
                                placeholder="Ingrese contraseña de autorización"
                              />
                            </div>
                            <Button onClick={() => handleUpdateTime(ticket.id)}>Autorizar Cambio de Tiempo</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" onClick={() => completeTicket(ticket.id)} className="gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Completar
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cola de Espera */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Cola de Espera ({waitingTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {waitingTickets.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay tickets en espera</p>
            </div>
          ) : (
            <div className="space-y-4">
              {waitingTickets.map((ticket, index) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold">#{ticket.ticketNumber}</div>
                    <div>
                      <p className="font-semibold">{ticket.customerName}</p>
                      <p className="text-sm text-muted-foreground">{getServiceLabel(ticket.service)}</p>
                      {ticket.posTicketNumber && <p className="text-xs text-blue-600">POS: {ticket.posTicketNumber}</p>}
                      {ticket.notes && <p className="text-xs text-muted-foreground">Notas: {ticket.notes}</p>}
                      <p className="text-xs text-muted-foreground">
                        Tiempo estimado: {ticket.estimatedTime} min • Posición: {index + 1} • Creado:{" "}
                        {ticket.createdAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {index === 0 && <Badge className="bg-primary">Próximo</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => callCustomer(ticket.id)} className="gap-2">
                      <Phone className="h-4 w-4" />
                      Llamar
                    </Button>
                    <Button size="sm" onClick={() => startTicket(ticket.id)} className="gap-2">
                      <Play className="h-4 w-4" />
                      Iniciar ({ticket.estimatedTime}min)
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                          <Clock className="h-4 w-4" />
                          Tiempo
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Actualizar Tiempo Estimado</DialogTitle>
                          <DialogDescription>
                            Ticket #{ticket.ticketNumber} - {ticket.customerName}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Nuevo tiempo (minutos)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={newTime}
                              onChange={(e) => setNewTime(Number(e.target.value))}
                              placeholder={`Actual: ${ticket.estimatedTime} min`}
                            />
                          </div>
                          <div>
                            <Label>Contraseña de Gerente</Label>
                            <Input
                              type="password"
                              value={timeUpdatePassword}
                              onChange={(e) => setTimeUpdatePassword(e.target.value)}
                              placeholder="Ingrese contraseña"
                            />
                          </div>
                          <Button onClick={() => handleUpdateTime(ticket.id)}>Actualizar</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tickets para Imprimir */}
      {waitingTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Impresión de Tickets
            </CardTitle>
            <CardDescription>Imprima tickets para los clientes en espera</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {waitingTickets.slice(0, 6).map((ticket) => (
                <TicketPrinter key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
