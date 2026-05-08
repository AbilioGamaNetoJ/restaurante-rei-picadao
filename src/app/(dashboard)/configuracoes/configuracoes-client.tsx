'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updateStoreSettings, updateStoreHours } from './actions';
import { Trash2, Plus } from 'lucide-react';

const DAYS_OF_WEEK = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

export function ConfiguracoesClient({ 
  initialSettings, 
  initialHours 
}: { 
  initialSettings: any; 
  initialHours: any[];
}) {
  const [isPending, startTransition] = useTransition();

  const [settings, setSettings] = useState({
    name: initialSettings?.name || '',
    address: initialSettings?.address || '',
    phone: initialSettings?.phone || '',
    deliveryRadiusKm: initialSettings?.deliveryRadiusKm || '10.00',
    minOrder: initialSettings?.minOrder || '45.00',
    deliveryFeeKm: initialSettings?.deliveryFeeKm || '1.50',
  });

  const [hours, setHours] = useState<any[]>(initialHours || []);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateStoreSettings(initialSettings?.id || null, settings);
        toast.success('Configurações da loja salvas com sucesso');
      } catch (error) {
        toast.error('Erro ao salvar configurações');
      }
    });
  };

  const handleHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialSettings?.id) {
      toast.error('Salve as configurações gerais primeiro antes de adicionar horários');
      return;
    }
    startTransition(async () => {
      try {
        await updateStoreHours(initialSettings.id, hours);
        toast.success('Horários de funcionamento salvos com sucesso');
      } catch (error) {
        toast.error('Erro ao salvar horários');
      }
    });
  };

  const addHour = () => {
    setHours([...hours, { dayOfWeek: 1, openTime: '18:00', closeTime: '23:00' }]);
  };

  const removeHour = (index: number) => {
    setHours(hours.filter((_, i) => i !== index));
  };

  const updateHour = (index: number, field: string, value: any) => {
    const newHours = [...hours];
    newHours[index] = { ...newHours[index], [field]: value };
    setHours(newHours);
  };

  return (
    <div className="space-y-8">
      {/* Dados Gerais e de Entrega */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Gerais e de Entrega</CardTitle>
          <CardDescription>
            Informações básicas do restaurante e configurações de frete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Loja</Label>
                <Input 
                  id="name" 
                  value={settings.name} 
                  onChange={(e) => setSettings({...settings, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input 
                  id="phone" 
                  value={settings.phone} 
                  onChange={(e) => setSettings({...settings, phone: e.target.value})} 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input 
                  id="address" 
                  value={settings.address} 
                  onChange={(e) => setSettings({...settings, address: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryRadiusKm">Raio de Entrega Máximo (Km)</Label>
                <Input 
                  id="deliveryRadiusKm" 
                  type="number"
                  step="0.1"
                  value={settings.deliveryRadiusKm} 
                  onChange={(e) => setSettings({...settings, deliveryRadiusKm: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryFeeKm">Taxa de Entrega por Km (R$)</Label>
                <Input 
                  id="deliveryFeeKm" 
                  type="number"
                  step="0.01"
                  value={settings.deliveryFeeKm} 
                  onChange={(e) => setSettings({...settings, deliveryFeeKm: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minOrder">Pedido Mínimo (R$)</Label>
                <Input 
                  id="minOrder" 
                  type="number"
                  step="0.01"
                  value={settings.minOrder} 
                  onChange={(e) => setSettings({...settings, minOrder: e.target.value})} 
                  required 
                />
              </div>
            </div>
            <Button type="submit" disabled={isPending}>Salvar Configurações</Button>
          </form>
        </CardContent>
      </Card>

      {/* Horários de Funcionamento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Horários de Funcionamento</CardTitle>
              <CardDescription>
                Configure os dias e horários em que o restaurante aceita pedidos.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addHour}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Horário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleHoursSubmit} className="space-y-4">
            {hours.length === 0 ? (
              <div className="text-center text-muted-foreground p-4 border rounded-md border-dashed">
                Nenhum horário configurado. Adicione um horário para a loja aparecer aberta.
              </div>
            ) : (
              <div className="space-y-4">
                {hours.map((hour, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-4 items-end border p-4 rounded-md">
                    <div className="space-y-2 flex-1">
                      <Label>Dia da Semana</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={hour.dayOfWeek}
                        onChange={(e) => updateHour(index, 'dayOfWeek', Number(e.target.value))}
                      >
                        {DAYS_OF_WEEK.map((day, i) => (
                          <option key={i} value={i}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label>Abertura</Label>
                      <Input 
                        type="time" 
                        value={hour.openTime}
                        onChange={(e) => updateHour(index, 'openTime', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label>Fechamento</Label>
                      <Input 
                        type="time" 
                        value={hour.closeTime}
                        onChange={(e) => updateHour(index, 'closeTime', e.target.value)}
                        required
                      />
                    </div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeHour(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button type="submit" disabled={isPending || hours.length === 0}>Salvar Horários</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
