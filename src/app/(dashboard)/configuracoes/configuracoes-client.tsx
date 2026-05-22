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
            <div className="grid gap-6 md:grid-cols-2">
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

      {/* Live Preview Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <h2 className="text-xl font-bold tracking-tight">Prévia em Tempo Real (Loja)</h2>
        </div>
        
        <Card className="overflow-hidden border-none shadow-2xl bg-gray-100 p-0 md:p-4">
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-xl w-full border relative">
            {/* Mock Header (Optional, but gives browser context) */}
            <header className="h-14 border-b bg-white/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
              <div className="flex items-center gap-2">
                <div className="bg-red-600 p-1.5 rounded-full">
                  <StoreIcon className="h-3 w-3 text-white" />
                </div>
                <span className="font-black text-sm tracking-tighter">{settings.name || "Sua Loja"}</span>
              </div>
              <div className="h-8 w-8 rounded-lg border flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-gray-200" />
              </div>
            </header>

            <div className="bg-gray-50 pb-12 flex flex-col">
              {/* Hero Banner Section (Truly Full Width) */}
              <div className="relative w-full h-[200px] md:h-[280px] overflow-hidden group">
                {settings.bannerUrl ? (
                  <img 
                    src={settings.bannerUrl} 
                    alt="Banner" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-600 via-red-500 to-orange-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>

              {/* Store Info Card (Floating Premium) */}
              <div className="relative -mt-16 md:-mt-24 z-10 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-white/50 p-6 flex flex-col md:flex-row items-center md:items-start gap-6 max-w-4xl w-[calc(100%-2rem)] mx-auto ring-1 ring-black/5 transition-all duration-500 hover:shadow-[0_30px_70px_rgba(0,0,0,0.18)]">
                {/* Logo */}
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-8 border-white bg-white shadow-2xl overflow-hidden flex-shrink-0 -mt-16 md:-mt-20 transition-transform duration-500 hover:scale-105">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt={settings.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white">
                      <span className="text-4xl font-black tracking-tighter">{settings.name?.[0] || "R"}</span>
                    </div>
                  )}
                </div>

                {/* Store Details */}
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter">
                      {settings.name || "Rei do Picadão"}
                    </h1>
                    <div className={cn(
                      "self-center md:self-auto px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors",
                      openStatus 
                        ? "bg-green-50 text-green-600 border-green-200" 
                        : "bg-red-50 text-red-600 border-red-200"
                    )}>
                      {openStatus ? "• Aberto agora" : "• Fechado"}
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-3 text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="bg-yellow-50 p-1.5 rounded-lg">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      </div>
                      <span className="font-bold text-gray-900">4.8</span>
                      <span className="opacity-60">(500+ avaliações)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-50 p-1.5 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-gray-900 font-bold">35-45 min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-purple-50 p-1.5 rounded-lg">
                        <Bike className="h-4 w-4 text-purple-500" />
                      </div>
                      <span className="text-gray-900 font-bold">Não entregamos acima de {settings.deliveryRadiusKm || "10"} km</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium justify-center md:justify-start">
                    <div className="bg-orange-50 p-1.5 rounded-lg">
                      <MapPin className="h-4 w-4 text-orange-500" />
                    </div>
                    <span className="text-gray-900 font-bold line-clamp-1">{settings.address || "Endereço não informado"}</span>
                  </div>

                  <div className="pt-2 flex items-center justify-center md:justify-start">
                    <div className="bg-gray-100/50 px-4 py-2 rounded-2xl flex items-center gap-3 border border-gray-200/50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pedido Mínimo</span>
                      <span className="text-base font-black text-gray-900">R$ {parseFloat(settings.minOrder || "0").toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Categories */}
              <div className="mt-8 px-4 md:px-8 overflow-hidden max-w-5xl mx-auto w-full">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {['Destaques', 'Porções', 'Bebidas', 'Sobremesas'].map((cat, i) => (
                    <div 
                      key={cat} 
                      className={cn(
                        "px-6 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap border transition-all",
                        i === 0 ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-200" : "bg-white text-gray-500 border-gray-200"
                      )}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-4 font-medium uppercase tracking-widest opacity-60">
            Esta é uma representação visual atualizada de como sua loja aparece para os clientes
          </p>
        </Card>
      </div>
    </div>
  );
}
