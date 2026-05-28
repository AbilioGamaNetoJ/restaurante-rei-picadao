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
    customerCpfCnpj: '',
    addressZip: '',
    addressStreet: '',
    addressNumber: '',
    addressComplement: '',
    addressNeighborhood: '',
    addressCity: '',
    addressState: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    setMounted(true);
    
    // Carregar dados salvos do localStorage
    const savedData = localStorage.getItem('checkout-customer-data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Error parsing saved checkout data', e);
      }
    }

    // Se o carrinho estiver vazio (e já tiver hidratado), redireciona para a home
    // Aguarda um pequeno delay para garantir que o zustand hidratou os dados do localStorage
    const timer = setTimeout(() => {
      if (useCartStore.persist.hasHydrated() && useCartStore.getState().items.length === 0) {
        router.push('/');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  if (!mounted) {
    return (
      <div className="container max-w-2xl mx-auto py-10 px-4 text-center">
        <p>Carregando formulário...</p>
      </div>
    );
  }

  // Se o carrinho estiver vazio, não renderiza o formulário enquanto o redirect acontece
  if (items.length === 0) {
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
          const newAddressData = {
            ...formData,
            addressZip: formattedZip,
            addressStreet: data.logradouro,
            addressNeighborhood: data.bairro,
            addressCity: data.localidade,
            addressState: data.uf,
          };
          setFormData(newAddressData);
          localStorage.setItem('checkout-customer-data', JSON.stringify(newAddressData));
        }
      } catch (error) {
        console.error('ViaCEP error:', error);
      }
    } else {
      localStorage.setItem('checkout-customer-data', JSON.stringify({ ...formData, addressZip: formattedZip }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    
    // Salvar no localStorage
    localStorage.setItem('checkout-customer-data', JSON.stringify(newFormData));
    
    // Validar e-mail em tempo real
    if (name === 'customerEmail') {
      validateField(name, value);
    }
  };


  const VALID_DDDS = [
    '11', '12', '13', '14', '15', '16', '17', '18', '19',
    '21', '22', '24', '27', '28', '31', '32', '33', '34',
    '35', '37', '38', '41', '42', '43', '44', '45', '46',
    '47', '48', '49', '51', '53', '54', '55', '61', '62',
    '64', '63', '65', '66', '67', '68', '69', '71', '73',
    '74', '75', '77', '79', '81', '87', '82', '83', '84',
    '85', '88', '86', '89', '91', '93', '94', '92', '97',
    '95', '96', '98', '99'
  ];

  const checkoutSchema = z.object({
    customerName: z.string().min(3, 'Nome muito curto'),
    customerEmail: z.string()
      .min(1, 'E-mail é obrigatório')
      .refine(v => v.includes('@'), 'Adicione o @ no e-mail')
      .email('E-mail inválido. Certifique-se de incluir o domínio.'),
    customerPhone: z.string()
      .transform(v => v.replace(/\D/g, ''))
      .refine(v => v.length === 11, 'O telefone deve ter exatamente 11 números (DDD + número)')
      .refine(v => VALID_DDDS.includes(v.slice(0, 2)), 'O DDD informado não é válido no Brasil'),
    customerCpfCnpj: z.string().transform(v => v.replace(/\D/g, '')).refine(v => [11, 14].includes(v.length), 'CPF ou CNPJ inválido'),
    addressZip: z.string().transform(v => v.replace(/\D/g, '')).refine(v => v.length === 8, 'CEP inválido'),
    addressStreet: z.string().min(3, 'Rua inválida'),
    addressNumber: z.string().min(1, 'Número obrigatório'),
    addressComplement: z.string().optional(),
    addressNeighborhood: z.string().min(2, 'Bairro inválido'),
    addressCity: z.string().min(2, 'Cidade inválida'),
    addressState: z.string().length(2, 'UF inválida'),
  });

  const validateField = (name: string, value: any) => {
    const fieldSchema = checkoutSchema.shape[name as keyof typeof checkoutSchema.shape];
    if (!fieldSchema) return;

    const result = fieldSchema.safeParse(value);
    if (!result.success) {
      setErrors(prev => ({ ...prev, [name]: result.error.issues[0].message }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const validation = checkoutSchema.safeParse(formData);
    
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.issues.forEach(err => {
        const fieldName = err.path[0]?.toString();
        if (fieldName) {
          newErrors[fieldName] = err.message;
        }
      });
      setErrors(newErrors);
      toast.error('Por favor, corrija os erros no formulário.');
      setLoading(false);
      return;
    }

    const validatedData = validation.data;

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

      // 2. Save checkout data to state (using cleaned data)
      setCheckoutData({
        ...formData,
        customerPhone: validatedData.customerPhone,
        customerCpfCnpj: validatedData.customerCpfCnpj,
        addressZip: validatedData.addressZip,
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
              {errors.customerName && <p className="text-red-500 text-sm font-medium">{errors.customerName}</p>}
              <Input required id="customerName" name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Ex: Abílio Gama" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Telefone/WhatsApp</Label>
              {errors.customerPhone && <p className="text-red-500 text-sm font-medium">{errors.customerPhone}</p>}
              <Input
                required
                id="customerPhone"
                name="customerPhone"
                value={formData.customerPhone}
                onBlur={() => validateField('customerPhone', formData.customerPhone)}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '');
                  
                  // Se começar com 55 (código do Brasil) e tiver mais de 11 dígitos, removemos o 55
                  if (v.startsWith('55') && v.length >= 12) {
                    v = v.substring(2);
                  }
                  
                  if (v.length > 11) v = v.slice(0, 11);
                  
                  if (v.length <= 10) {
                    v = v.replace(/(\d{2})(\d)/, '($1) $2');
                    v = v.replace(/(\d{4})(\d)/, '$1-$2');
                  } else {
                    v = v.replace(/(\d{2})(\d)/, '($1) $2');
                    v = v.replace(/(\d{5})(\d)/, '$1-$2');
                  }
                  
                  const newFormData = { ...formData, customerPhone: v };
                  setFormData(newFormData);
                  localStorage.setItem('checkout-customer-data', JSON.stringify(newFormData));
                  
                  // Validar telefone em tempo real
                  validateField('customerPhone', v);
                }}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customerEmail">E-mail</Label>
              {errors.customerEmail && <p className="text-red-500 text-sm font-medium">{errors.customerEmail}</p>}
              <Input 
                required 
                type="email" 
                id="customerEmail" 
                name="customerEmail" 
                value={formData.customerEmail} 
                onBlur={() => validateField('customerEmail', formData.customerEmail)}
                onChange={handleChange} 
                placeholder="seu@email.com" 
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customerCpfCnpj">CPF ou CNPJ</Label>
              {errors.customerCpfCnpj && <p className="text-red-500 text-sm font-medium">{errors.customerCpfCnpj}</p>}
              <Input
                required
                id="customerCpfCnpj"
                name="customerCpfCnpj"
                value={formData.customerCpfCnpj}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '');
                  if (v.length <= 11) {
                    v = v.replace(/(\d{3})(\d)/, '$1.$2');
                    v = v.replace(/(\d{3})(\d)/, '$1.$2');
                    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                  } else {
                    v = v.slice(0, 14);
                    v = v.replace(/^(\d{2})(\d)/, '$1.$2');
                    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
                    v = v.replace(/(\d{4})(\d)/, '$1-$2');
                  }
                  const newFormData = { ...formData, customerCpfCnpj: v };
                  setFormData(newFormData);
                  localStorage.setItem('checkout-customer-data', JSON.stringify(newFormData));
                }}
                placeholder="000.000.000-00"
                maxLength={18}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h2 className="text-xl font-semibold">Endereço</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addressZip">CEP</Label>
              {errors.addressZip && <p className="text-red-500 text-sm font-medium">{errors.addressZip}</p>}
              <Input required id="addressZip" name="addressZip" value={formData.addressZip} onChange={handleZipChange} maxLength={9} placeholder="00000-000" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="addressStreet">Rua / Logradouro</Label>
              {errors.addressStreet && <p className="text-red-500 text-sm font-medium">{errors.addressStreet}</p>}
              <Input required id="addressStreet" name="addressStreet" value={formData.addressStreet} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressNumber">Número</Label>
              {errors.addressNumber && <p className="text-red-500 text-sm font-medium">{errors.addressNumber}</p>}
              <Input required id="addressNumber" name="addressNumber" value={formData.addressNumber} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressComplement">Complemento (opcional)</Label>
              {errors.addressComplement && <p className="text-red-500 text-sm font-medium">{errors.addressComplement}</p>}
              <Input id="addressComplement" name="addressComplement" value={formData.addressComplement} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressNeighborhood">Bairro</Label>
              {errors.addressNeighborhood && <p className="text-red-500 text-sm font-medium">{errors.addressNeighborhood}</p>}
              <Input required id="addressNeighborhood" name="addressNeighborhood" value={formData.addressNeighborhood} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2 gap-4 space-y-0">
              <div className="space-y-2">
                <Label htmlFor="addressCity">Cidade</Label>
                {errors.addressCity && <p className="text-red-500 text-sm font-medium">{errors.addressCity}</p>}
                <Input required id="addressCity" name="addressCity" value={formData.addressCity} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressState">Estado</Label>
                {errors.addressState && <p className="text-red-500 text-sm font-medium">{errors.addressState}</p>}
                <Input 
                  required 
                  id="addressState" 
                  name="addressState" 
                  value={formData.addressState} 
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    const newFormData = { ...formData, addressState: v };
                    setFormData(newFormData);
                    localStorage.setItem('checkout-customer-data', JSON.stringify(newFormData));
                  }} 
                  maxLength={2} 
                  placeholder="SC"
                />
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
