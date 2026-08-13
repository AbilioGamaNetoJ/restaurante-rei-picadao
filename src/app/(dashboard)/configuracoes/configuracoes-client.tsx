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

const DAYS_OF_WEEK = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

type StoreSettings = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  deliveryRadiusKm: string;
  minOrder: string;
  deliveryFeeKm: string;
  logoUrl: string | null;
  bannerUrl: string | null;
};

type StoreHour = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
};

type StoreHourRow = StoreHour & { id: string };

export function ConfiguracoesClient({
  initialSettings,
  initialHours
}: Readonly<{
  initialSettings: StoreSettings | null;
  initialHours: StoreHour[];
}>) {
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

  const [hours, setHours] = useState<StoreHourRow[]>(
    () => (initialHours || []).map((hour) => ({ ...hour, id: crypto.randomUUID() }))
  );

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateStoreSettings(initialSettings?.id || null, settings);
        toast.success('Configurações da loja salvas com sucesso');
      } catch {
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
      } catch {
        toast.error('Erro ao salvar horários');
      }
    });
  };

  const addHour = () => {
    setHours([...hours, { id: crypto.randomUUID(), dayOfWeek: 1, openTime: '18:00', closeTime: '23:00' }]);
  };

  const removeHour = (index: number) => {
    setHours(hours.filter((_, i) => i !== index));
  };

  const updateHour = (index: number, field: keyof StoreHour, value: string | number) => {
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
                        type="button"
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
                      allowedContent: "Imagem até 8MB"
                    }}
                  />
                </div>
              </div>

              {/* Banner */}
              <div className="space-y-4">
                <Label>Banner da Página de Vendas</Label>
                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  {settings.bannerUrl ? (
                    <div className="relative group w-full aspect-[16/5] max-w-[400px]">
                      <img 
                        src={settings.bannerUrl} 
                        alt="Banner" 
                        className="w-full h-full object-cover rounded-xl border-2 border-white shadow-xl" 
                      />
                      <button 
                        onClick={() => setSettings({...settings, bannerUrl: ''})}
                        className="absolute -top-3 -right-3 bg-red-600 text-white p-2 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full aspect-[16/5] max-w-[400px] flex items-center justify-center border-2 border-dashed rounded-xl text-muted-foreground bg-white text-center p-4">
                      Selecione uma imagem para o banner de fundo
                    </div>
                  )}
                  {settings.bannerUrl ? (
                    <div className="flex flex-col items-center">
                      <Button 
                        type="button"
                        onClick={() => toast.error("Exclua a foto atual clicando na lixeira antes de enviar uma nova")}
                        className="bg-red-600 hover:bg-red-700 rounded-xl h-10 px-6 text-sm font-bold shadow-md shadow-red-100"
                      >
                        Escolher Banner
                      </Button>
                      <p className="text-[10px] font-medium text-muted-foreground mt-2">Recomendado: 1920x600px (até 8MB)</p>
                    </div>
                  ) : (
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
                        allowedContent: "Recomendado: 1920x600px (até 8MB)"
                      }}
                    />
                  )}
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
                  <div key={hour.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end border p-4 rounded-md">
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
          <CardContent className="p-0 overflow-hidden">
            {/* Wrapper com fundo cinza claro para simular a página da loja */}
            <div className="bg-gray-50 p-4 sm:p-6 rounded-xl">
              <div className="border rounded-xl overflow-visible bg-transparent">

                {/* Hero Banner — mesma altura da loja real */}
                <div className="relative w-full h-[180px] sm:h-[280px] overflow-hidden rounded-t-xl group">
                  {settings.bannerUrl ? (
                    <img
                      src={settings.bannerUrl}
                      alt="Banner"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-600 via-red-500 to-orange-500" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-t-xl" />
                </div>

                {/* Store Info Card — mesmo estilo flutuante da loja real */}
                <div className="relative -mt-12 sm:-mt-20 z-10 bg-white/90 backdrop-blur-2xl rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-white/50 p-4 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 max-w-4xl mx-auto w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] ring-1 ring-black/5">

                  {/* Logo — posicionada igual à loja real */}
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-[6px] border-white bg-white shadow-xl overflow-hidden flex-shrink-0 -mt-14 sm:-mt-20 transition-transform duration-500 hover:scale-105">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt={settings.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white">
                        <span className="text-3xl font-black tracking-tighter">{settings.name?.[0] || "R"}</span>
                      </div>
                    )}
                  </div>

                  {/* Store Details */}
                  <div className="flex-1 text-center sm:text-left space-y-3 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tighter truncate">
                        {settings.name || "Sua Loja"}
                      </h1>
                      <div className={cn(
                        "self-center sm:self-auto px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors shrink-0",
                        openStatus
                          ? "bg-green-50 text-green-600 border-green-200"
                          : "bg-red-50 text-red-600 border-red-200"
                      )}>
                        {openStatus ? "• Aberto agora" : "• Fechado"}
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-5 gap-y-2 text-xs text-gray-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <div className="bg-yellow-50 p-1 rounded-md">
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        </div>
                        <span className="font-bold text-gray-900">4.8</span>
                        <span className="opacity-60">(500+ avaliações)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="bg-blue-50 p-1 rounded-md">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                        </div>
                        <span className="text-gray-900 font-bold">35-45 min</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="bg-purple-50 p-1 rounded-md">
                          <Bike className="h-3.5 w-3.5 text-purple-500" />
                        </div>
                        <span className="text-gray-900 font-bold truncate">
                          Taxa: R$ {Number.parseFloat(settings.deliveryFeeKm || "0").toFixed(2)}/km
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-gray-500 font-medium justify-center sm:justify-start">
                      <div className="bg-orange-50 p-1 rounded-md shrink-0 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-orange-500" />
                      </div>
                      <span className="text-gray-900 font-bold text-left break-words line-clamp-2 sm:line-clamp-none">{settings.address || "Endereço não informado"}</span>
                    </div>

                    <div className="pt-2 flex items-center justify-center sm:justify-start">
                      <div className="bg-gray-100/50 px-4 py-2 rounded-xl flex items-center gap-2 border border-gray-200/50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pedido Mínimo</span>
                        <span className="text-base font-black text-gray-900">R$ {Number.parseFloat(settings.minOrder || "0").toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Espaçamento inferior do card */}
                <div className="h-6" />
              </div>
            </div>

            <p className="text-center text-[10px] text-muted-foreground py-3 font-medium uppercase tracking-widest opacity-60">
              Esta é uma representação visual atualizada de como sua loja aparece para os clientes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
