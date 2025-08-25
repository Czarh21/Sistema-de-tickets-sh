"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, Clock, Save, AlertCircle } from "lucide-react"
import { useTickets } from "@/lib/ticket-context"
import type { ServiceSettings } from "@/lib/types"

export function ServiceSettingsDialog() {
  const { state, updateServiceSettings } = useTickets()
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [settings, setSettings] = useState<ServiceSettings>(state.serviceSettings)
  const [error, setError] = useState("")

  const handleSave = () => {
    if (!password) {
      setError("Ingrese la contraseña de gerente")
      return
    }

    const success = updateServiceSettings(settings, password)
    if (success) {
      setIsOpen(false)
      setPassword("")
      setError("")
    } else {
      setError("Contraseña incorrecta")
    }
  }

  const updateServiceTime = (serviceKey: string, time: number) => {
    setSettings((prev) => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        defaultTime: Math.max(0, time),
      },
    }))
  }

  const toggleServiceEnabled = (serviceKey: string, enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        enabled,
      },
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurar Servicios
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Configuración de Servicios
          </DialogTitle>
          <DialogDescription>
            Configure los tiempos personalizados para cada servicio. Estos tiempos se aplicarán automáticamente a nuevos
            tickets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {Object.entries(settings).map(([key, service]) => (
            <Card key={key} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-medium">{service.name}</Label>
                <Switch checked={service.enabled} onCheckedChange={(enabled) => toggleServiceEnabled(key, enabled)} />
              </div>

              {service.enabled && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Tiempo personalizado (minutos)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="999"
                      value={service.defaultTime}
                      onChange={(e) => updateServiceTime(key, Number.parseInt(e.target.value) || 0)}
                      placeholder="Ej: 15"
                      className="flex-1"
                    />
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateServiceTime(key, 5)}
                        className="px-2 text-xs"
                      >
                        5m
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateServiceTime(key, 15)}
                        className="px-2 text-xs"
                      >
                        15m
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateServiceTime(key, 30)}
                        className="px-2 text-xs"
                      >
                        30m
                      </Button>
                    </div>
                  </div>
                  {service.defaultTime === 0 ? (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Sin tiempo predefinido - se podrá asignar manualmente
                    </p>
                  ) : (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Tiempo estimado: {service.defaultTime} minutos
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-1">💡 Tiempos Personalizados</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Los tiempos se aplicarán automáticamente a nuevos tickets</li>
              <li>• Puedes ajustar tiempos individuales desde el dashboard</li>
              <li>• Usa 0 minutos para servicios sin tiempo fijo</li>
            </ul>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label>Contraseña de Gerente</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese contraseña"
            />
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { ServiceSettingsDialog as ServiceSettings }
