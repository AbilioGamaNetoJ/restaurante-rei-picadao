'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updateStoreSettings, updateStoreHours } from './actions';
import { Trash2, Plus, Star, Clock, Bike } from 'lucide-react';
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
                      setSettings({...settings, logoUrl: res[0].url});
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
                      setSettings({...settings, bannerUrl: res[0].url});
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
        
        <Card className="overflow-hidden border-none shadow-2xl bg-gray-100 p-4 md:p-8">
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-xl max-w-4xl mx-auto w-full border">
            {/* Mock Header */}
            <header className="h-14 border-b bg-white/70 backdrop-blur-md px-6 flex items-center justify-between">
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

            <div className="bg-gray-50 pb-12">
              {/* Mock Banner */}
              <div className="relative w-full h-32 md:h-48 overflow-hidden">
                {settings.bannerUrl ? (
                  <img src={settings.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-red-500 to-orange-500" />
                )}
                <div className="absolute inset-0 bg-black/20" />
              </div>

              {/* Mock Store Info */}
              <div className="px-6 md:px-10 -mt-12 relative z-10">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/50 flex flex-col md:flex-row items-center md:items-start gap-4">
                  {/* Logo */}
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex-shrink-0 -mt-14">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-red-600 flex items-center justify-center text-white text-2xl font-black">
                        {settings.name?.[0] || "L"}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <h3 className="text-xl md:text-2xl font-black tracking-tighter">{settings.name || "Nome da Loja"}</h3>
                      <div className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-green-50 text-green-600 border border-green-200 self-center md:self-auto">
                        Aberto
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-1 text-[10px] text-gray-500 font-bold">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span>4.8</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>35-45 min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bike className="h-3 w-3" />
                        <span>R$ {parseFloat(settings.deliveryFeeKm || "0").toFixed(2)}/km</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Categories */}
              <div className="mt-6 px-6 overflow-hidden">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {['Burgers', 'Bebidas', 'Acompanhamentos'].map((cat, i) => (
                    <div 
                      key={cat} 
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap border transition-all",
                        i === 0 ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-100" : "bg-white text-gray-400 border-gray-100"
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
            Esta é uma representação visual de como sua loja aparece para os clientes
          </p>
        </Card>
      </div>
    </div>
  );
}
