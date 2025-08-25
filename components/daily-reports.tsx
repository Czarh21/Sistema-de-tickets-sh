"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Download, TrendingUp, Clock, Users, CheckCircle, AlertTriangle } from "lucide-react"
import { useTickets } from "@/lib/ticket-context"

export function DailyReports() {
  const { state, generateDailyReport, getServiceLabel } = useTickets()
  const [selectedDate, setSelectedDate] = useState(new Date().toDateString())

  const dailyReport = generateDailyReport()
  const todayTickets = state.tickets.filter((ticket) => ticket.createdAt.toDateString() === selectedDate)

  // Estadísticas por servicio
  const serviceStats = todayTickets.reduce(
    (acc, ticket) => {
      const service = getServiceLabel(ticket.service)
      if (!acc[service]) {
        acc[service] = { name: service, count: 0, completed: 0, avgTime: 0, totalTime: 0 }
      }
      acc[service].count++
      if (ticket.status === "completed") {
        acc[service].completed++
        if (ticket.startedAt && ticket.completedAt) {
          const actualTime = (ticket.completedAt.getTime() - ticket.startedAt.getTime()) / (1000 * 60)
          acc[service].totalTime += actualTime
        }
      }
      return acc
    },
    {} as Record<string, any>,
  )

  // Calcular tiempo promedio
  Object.values(serviceStats).forEach((stat: any) => {
    if (stat.completed > 0) {
      stat.avgTime = Math.round(stat.totalTime / stat.completed)
    }
  })

  const serviceChartData = Object.values(serviceStats)

  // Datos para gráfico de tiempo
  const hourlyData = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8 // 8 AM to 7 PM
    const hourTickets = todayTickets.filter((ticket) => {
      const ticketHour = ticket.createdAt.getHours()
      return ticketHour === hour
    })
    return {
      hour: `${hour}:00`,
      tickets: hourTickets.length,
      completed: hourTickets.filter((t) => t.status === "completed").length,
    }
  })

  const COLORS = ["#46c9ec", "#003cab", "#f9fafb", "#e3342f", "#ffed4a"]

  const handleExportReport = () => {
    const reportData = {
      date: selectedDate,
      summary: dailyReport,
      serviceStats,
      hourlyData,
      tickets: todayTickets,
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `reporte-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel de Reportes</h1>
          <p className="text-muted-foreground">Análisis y estadísticas del día</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport} className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Resumen del Día */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">{dailyReport.totalTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completados a Tiempo</p>
                <p className="text-2xl font-bold">{dailyReport.completedOnTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Excedidos</p>
                <p className="text-2xl font-bold">{dailyReport.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Eficiencia</p>
                <p className="text-2xl font-bold">
                  {dailyReport.totalTickets > 0
                    ? Math.round((dailyReport.completedOnTime / dailyReport.totalTickets) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets por Hora */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tickets por Hora
            </CardTitle>
            <CardDescription>Distribución de tickets a lo largo del día</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tickets" fill="#46c9ec" name="Total" />
                <Bar dataKey="completed" fill="#003cab" name="Completados" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Servicios */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Servicios</CardTitle>
            <CardDescription>Tickets por tipo de servicio</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {serviceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas por Servicio */}
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento por Servicio</CardTitle>
          <CardDescription>Análisis detallado de cada tipo de servicio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.values(serviceStats).map((stat: any, index) => (
              <div key={stat.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <div>
                    <p className="font-semibold">{stat.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.completed} de {stat.count} completados
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{stat.avgTime} min promedio</p>
                  <Badge variant={stat.completed === stat.count ? "default" : "secondary"}>
                    {Math.round((stat.completed / stat.count) * 100)}% completado
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tickets del Día */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets del Día - Control por Servicio</CardTitle>
          <CardDescription>
            Marcar servicios individuales como completados para identificar cuellos de botella
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {todayTickets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay tickets para mostrar</p>
            ) : (
              todayTickets.map((ticket) => {
                const actualTime =
                  ticket.startedAt && ticket.completedAt
                    ? Math.floor((ticket.completedAt.getTime() - ticket.startedAt.getTime()) / (1000 * 60))
                    : null
                const isOverdue = actualTime && actualTime > ticket.estimatedTime
                const currentElapsed =
                  ticket.status === "in-progress" && ticket.startedAt
                    ? Math.floor((new Date().getTime() - ticket.startedAt.getTime()) / (1000 * 60))
                    : null
                const isCurrentlyOverdue = currentElapsed && currentElapsed > ticket.estimatedTime

                return (
                  <div
                    key={ticket.id}
                    className={`border rounded-lg p-4 ${
                      isOverdue || isCurrentlyOverdue ? "bg-red-50 border-red-200" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono font-bold text-lg ${isOverdue || isCurrentlyOverdue ? "text-red-600" : ""}`}
                        >
                          #{ticket.ticketNumber}
                        </span>
                        <div>
                          <p className="font-medium">{ticket.customerName}</p>
                          <p className="text-sm text-muted-foreground">{getServiceLabel(ticket.service)}</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          ticket.status === "completed"
                            ? isOverdue
                              ? "destructive"
                              : "default"
                            : ticket.status === "in-progress"
                              ? isCurrentlyOverdue
                                ? "destructive"
                                : "secondary"
                              : "outline"
                        }
                      >
                        {ticket.status === "waiting" && "En Espera"}
                        {ticket.status === "in-progress" && (isCurrentlyOverdue ? "Excedido" : "En Proceso")}
                        {ticket.status === "completed" && (isOverdue ? "Completado (Tarde)" : "Completado")}
                      </Badge>
                    </div>

                    {ticket.serviceStatuses && ticket.serviceStatuses.length > 1 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-2">Estado por Servicio:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {ticket.serviceStatuses.map((serviceStatus) => (
                            <div
                              key={serviceStatus.service}
                              className={`flex items-center justify-between p-2 rounded border text-sm ${
                                serviceStatus.isCompleted
                                  ? "bg-green-50 border-green-200"
                                  : ticket.status === "in-progress"
                                    ? "bg-yellow-50 border-yellow-200"
                                    : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <span className="font-medium">{getServiceLabel(serviceStatus.service)}</span>
                              <div className="flex items-center gap-2">
                                {serviceStatus.isCompleted ? (
                                  <div className="text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                  </div>
                                ) : ticket.status === "in-progress" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs bg-transparent"
                                    onClick={() => {
                                      const completedBy = prompt("¿Quién completó este servicio?")
                                      if (completedBy) {
                                        // This would need to be connected to the context
                                        console.log(
                                          `Completing ${serviceStatus.service} for ticket ${ticket.id} by ${completedBy}`,
                                        )
                                      }
                                    }}
                                  >
                                    Marcar Listo
                                  </Button>
                                ) : (
                                  <div className="text-gray-400">
                                    <Clock className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Show who completed each service and when */}
                        <div className="mt-2 text-xs text-muted-foreground">
                          {ticket.serviceStatuses
                            .filter((status) => status.isCompleted && status.completedBy)
                            .map((status) => (
                              <div key={status.service}>
                                {getServiceLabel(status.service)} completado por {status.completedBy}
                                {status.completedAt &&
                                  ` a las ${status.completedAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Enhanced time information display */}
                    <div className="text-xs text-muted-foreground">
                      <span>Estimado: {ticket.estimatedTime} min</span>
                      {actualTime && (
                        <span className={`ml-2 ${isOverdue ? "text-red-600 font-semibold" : "text-green-600"}`}>
                          • Real: {actualTime} min {isOverdue ? `(+${actualTime - ticket.estimatedTime} min)` : ""}
                        </span>
                      )}
                      {currentElapsed && (
                        <span className={`ml-2 ${isCurrentlyOverdue ? "text-red-600 font-semibold" : ""}`}>
                          • Transcurrido: {currentElapsed} min{" "}
                          {isCurrentlyOverdue ? `(¡Excedido por ${currentElapsed - ticket.estimatedTime} min!)` : ""}
                        </span>
                      )}
                      <div className="mt-1">
                        {ticket.createdAt.toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {ticket.completedAt && (
                          <span className="ml-2">
                            • Terminado:{" "}
                            {ticket.completedAt.toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
