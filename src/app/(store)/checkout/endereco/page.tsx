'use client';
import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function EnderecoPage() {
  const router = useRouter();
  const { items, setCheckoutData } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = React.useState(false);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    addressZip: '',
    addressStreet: '',
    addressNumber: '',
    addressComplement: '',
    addressNeighborhood: '',
    addressCity: '',
    addressState: '',
  });
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="container max-w-2xl mx-auto py-10 px-4 text-center">
        <p>Carregando formulário...</p>
      </div>
    );
  }

  if (items.length === 0) {
    router.push('/carrinho');
    return null;
  }

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let zip = e.target.value.replace(/\D/g, '');
    if (zip.length > 8) zip = zip.slice(0, 8);
    
    let formattedZip = zip;
    if (zip.length > 5) {
      formattedZip = `${zip.slice(0, 5)}-${zip.slice(5)}`;
    }

    setFormData({ ...formData, addressZip: formattedZip });

    if (zip.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            addressStreet: data.logradouro,
            addressNeighborhood: data.bairro,
            addressCity: data.localidade,
            addressState: data.uf,
          }));
        }
      } catch (error) {
        console.error('ViaCEP error:', error);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Calculate delivery fee and validate address distance
      const res = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao calcular frete.');
        setLoading(false);
        return;
      }

      // 2. Save checkout data to state
      setCheckoutData({
        ...formData,
        distanceKm: data.distanceKm,
        deliveryFee: data.deliveryFee,
        lat: data.lat,
        lng: data.lng,
      });

      // 3. Redirect to payment
      router.push('/checkout/pagamento');
    } catch (error) {
      toast.error('Ocorreu um erro ao processar o endereço.');
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Endereço de Entrega</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Seus Dados</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nome Completo</Label>
              <Input required id="customerName" name="customerName" value={formData.customerName} onChange={handleChange} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Telefone/WhatsApp</Label>
              <Input required id="customerPhone" name="customerPhone" value={formData.customerPhone} onChange={handleChange} />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customerEmail">E-mail</Label>
              <Input required type="email" id="customerEmail" name="customerEmail" value={formData.customerEmail} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h2 className="text-xl font-semibold">Endereço</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addressZip">CEP</Label>
              <Input required id="addressZip" name="addressZip" value={formData.addressZip} onChange={handleZipChange} maxLength={9} placeholder="00000-000" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="addressStreet">Rua / Logradouro</Label>
              <Input required id="addressStreet" name="addressStreet" value={formData.addressStreet} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressNumber">Número</Label>
              <Input required id="addressNumber" name="addressNumber" value={formData.addressNumber} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressComplement">Complemento (opcional)</Label>
              <Input id="addressComplement" name="addressComplement" value={formData.addressComplement} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressNeighborhood">Bairro</Label>
              <Input required id="addressNeighborhood" name="addressNeighborhood" value={formData.addressNeighborhood} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2 gap-4 space-y-0">
              <div className="space-y-2">
                <Label htmlFor="addressCity">Cidade</Label>
                <Input required id="addressCity" name="addressCity" value={formData.addressCity} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressState">Estado</Label>
                <Input required id="addressState" name="addressState" value={formData.addressState} onChange={handleChange} maxLength={2} />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end">
          <Button type="submit" disabled={loading} size="lg" className="w-full md:w-auto">
            {loading ? 'Calculando Frete...' : 'Continuar para Pagamento'}
          </Button>
        </div>
      </form>
    </div>
  );
}
