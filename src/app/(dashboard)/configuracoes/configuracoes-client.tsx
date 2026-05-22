'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updateStoreSettings, updateStoreHours } from './actions';
import { Trash2, Plus, Star, Clock, Bike, MapPin } from 'lucide-react';
import { UploadButton } from '@/lib/uploadthing';
import { cn } from '@/lib/utils';
import { StoreIcon } from '@/components/store/store-icons';

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
    logoUrl: initialSettings?.logoUrl || '',
    bannerUrl: initialSettings?.bannerUrl || '',
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

  const isStoreOpen = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todayHours = hours.filter(h => h.dayOfWeek === currentDay);
    if (todayHours.length === 0) return false;

    return todayHours.some(h => {
      if (!h.openTime || !h.closeTime) return false;
      const [openH, openM] = h.openTime.split(':').map(Number);
      const [closeH, closeM] = h.closeTime.split(':').map(Number);
      const openTime = openH * 60 + openM;
      const closeTime = closeH * 60 + closeM;
      return currentTime >= openTime && currentTime <= closeTime;
    });
  };

  const openStatus = isStoreOpen();

  return (
    <div className="space-y-6">
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
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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

      {/* Identidade Visual */}
      <Card>
        <CardHeader>
          <CardTitle>Identidade Visual</CardTitle>
          <CardDescription>
            Personalize a aparência da sua loja para os clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {/* Logo */}
              <div className="space-y-4">
                <Label>Logo do Restaurante</Label>
                <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-gray-50">
                  {settings.logoUrl ? (
                    <div className="relative group w-32 h-32">
                      <img 
                        src={settings.logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-cover rounded-full bg-white border shadow-sm" 
                      />
                      <button 
                        onClick={() => setSettings({...settings, logoUrl: ''})}
                        className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center border-2 border-dashed rounded-full text-muted-foreground bg-white">
                      Sem Logo
                    </div>
                  )}
                  <UploadButton
                    endpoint="productImage"
                    onClientUploadComplete={(res) => {
                      if (!res || res.length === 0) return;
                      setSettings({...settings, logoUrl: res[0].ufsUrl || res[0].url});
                      toast.success("Logo enviado com sucesso");
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Erro: ${error.message}`);
                    }}
                    appearance={{
                      button: "bg-red-600 hover:bg-red-700 ut-uploading:cursor-not-allowed rounded-md h-9 px-4 text-sm",
                      allowedContent: "text-[10px] text-muted-foreground"
                    }}
                    content={{
                      button: "Enviar Logo",
                      allowedContent: "Imagem até 4MB"
                    }}
                  />
                </div>
              </div>

              {/* Banner */}
              <div className="space-y-4">
                <Label>Banner da Página de Vendas</Label>
                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  {settings.bannerUrl ? (
                    <div className="relative group w-full aspect-[21/9] max-w-[400px]">
                      <img 
                        src={settings.bannerUrl} 
                        alt="Banner" 
                        className="w-full h-full object-cover rounded-xl border-2 border-white shadow-xl" 
                      />
                      <button 
                        onClick={() => setSettings({...settings, bannerUrl: ''})}
                        className="absolute -top-3 -right-3 bg-red-600 text-white p-2 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full aspect-[21/9] max-w-[400px] flex items-center justify-center border-2 border-dashed rounded-xl text-muted-foreground bg-white text-center p-4">
                      Selecione uma imagem panorâmica para o banner de fundo
                    </div>
                  )}
                  <UploadButton
                    endpoint="productImage"
                    onClientUploadComplete={(res) => {
                      if (!res || res.length === 0) return;
                      setSettings({...settings, bannerUrl: res[0].ufsUrl || res[0].url});
                      toast.success("Banner enviado com sucesso");
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Erro: ${error.message}`);
                    }}
                    appearance={{
                      button: "bg-red-600 hover:bg-red-700 ut-uploading:cursor-not-allowed rounded-xl h-10 px-6 text-sm font-bold shadow-md shadow-red-100",
                      allowedContent: "text-[10px] font-medium text-muted-foreground mt-2"
                    }}
                    content={{
                      button: "Escolher Banner",
                      allowedContent: "Recomendado: 1200x400px"
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSettingsSubmit} 
                disabled={isPending}
                className="rounded-xl px-8 font-bold"
              >
                Salvar Identidade Visual
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horários de Funcionamento */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="min-w-0 w-full">
              <CardTitle className="truncate">Horários de Funcionamento</CardTitle>
              <CardDescription className="whitespace-normal break-words">
                Configure os dias e horários em que o restaurante aceita pedidos.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addHour} className="shrink-0">
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
                  <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end border p-4 rounded-md">
                    <div className="space-y-2 w-full sm:flex-1">
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
                    <div className="grid grid-cols-[1fr_1fr_auto] w-full sm:w-auto sm:flex-1 gap-2 sm:gap-4 items-end min-w-0">
                      <div className="space-y-2 min-w-0">
                        <Label className="text-xs sm:text-sm">Abertura</Label>
                        <Input 
                          type="time" 
                          value={hour.openTime}
                          onChange={(e) => updateHour(index, 'openTime', e.target.value)}
                          required
                          className="w-full px-1 sm:px-3"
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label className="text-xs sm:text-sm">Fechamento</Label>
                        <Input 
                          type="time" 
                          value={hour.closeTime}
                          onChange={(e) => updateHour(index, 'closeTime', e.target.value)}
                          required
                          className="w-full px-1 sm:px-3"
                        />
                      </div>
                      <Button type="button" variant="destructive" size="icon" className="shrink-0 mb-[1px]" onClick={() => removeHour(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button type="submit" disabled={isPending || hours.length === 0}>Salvar Horários</Button>
          </form>
        </CardContent>
      </Card>

      {/* Live Preview Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          <h2 className="text-xl font-bold tracking-tight">Prévia em Tempo Real (Loja)</h2>
        </div>
        
        <Card>
          <CardContent className="p-0 sm:p-6">
            <div className="border rounded-none sm:rounded-lg overflow-hidden bg-white">
              {/* Hero Banner */}
              <div className="w-full h-32 sm:h-48 relative bg-slate-100">
                {settings.bannerUrl ? (
                  <img 
                    src={settings.bannerUrl} 
                    alt="Banner" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-600 to-orange-500" />
                )}
              </div>

              {/* Store Info */}
              <div className="p-4 sm:p-6 relative">
                {/* Logo */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden absolute -top-10 sm:-top-12 left-4 sm:left-6">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt={settings.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-red-600 flex items-center justify-center text-white font-bold text-xl">
                      {settings.name?.[0] || "R"}
                    </div>
                  )}
                </div>

                <div className="mt-12 sm:mt-14 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                    <h1 className="text-2xl font-bold text-gray-900 truncate">
                      {settings.name || "Sua Loja"}
                    </h1>
                    <div className={cn(
                      "inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold shrink-0",
                      openStatus 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    )}>
                      {openStatus ? "Aberto agora" : "Fechado"}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2 min-w-0">
                      <Star className="h-4 w-4 text-yellow-500 shrink-0" />
                      <span className="truncate">4.8 (500+ avaliações)</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                      <span className="truncate">35-45 min</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
                      <span className="truncate">{settings.address || "Endereço não informado"}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Bike className="h-4 w-4 text-purple-500 shrink-0" />
                      <span className="truncate">Taxa: R$ {parseFloat(settings.deliveryFeeKm || "0").toFixed(2)}/km</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2 border">
                    <span className="text-sm text-gray-500 font-medium">Pedido Mínimo:</span>
                    <span className="font-semibold">R$ {parseFloat(settings.minOrder || "0").toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-4 font-medium uppercase tracking-widest opacity-60">
              Esta é uma representação visual atualizada de como sua loja aparece para os clientes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
