const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';

interface AsaasCustomer {
  id: string;
}

export async function createAsaasCustomer(
  name: string, 
  email: string, 
  phone: string, 
  cpfCnpj: string,
  addressData?: {
    addressZip: string;
    addressStreet: string;
    addressNumber: string;
    addressComplement?: string;
    addressNeighborhood: string;
  }
): Promise<AsaasCustomer | null> {
  const apiKey = process.env.ASAAS_API_KEY;
  
  if (!apiKey) {
    console.error('ASAAS_API_KEY is missing from process.env');
    throw new Error("ASAAS_API_KEY not configured. Please check your .env file and restart the server.");
  }
  
  console.log('Asaas Customer - API Key Check:', { 
    prefix: apiKey.substring(0, 5), 
    length: apiKey.length 
  });

  // Strip formatting from cpfCnpj and phone (remove dots, dashes, slashes, spaces, parens)
  const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');
  let cleanPhone = phone.replace(/\D/g, '');

  // Add Brazil country code (55) if it's a standard 10 or 11 digit number
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    cleanPhone = `55${cleanPhone}`;
  }

  try {
    // First, check if customer exists
    const searchRes = await fetch(`${ASAAS_API_URL}/customers?email=${encodeURIComponent(email)}`, {
      headers: {
        'access_token': apiKey,
      }
    });
    
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.data && searchData.data.length > 0) {
        // Customer exists, we could update the address here, but returning ID is fine for now
        return { id: searchData.data[0].id };
      }
    }

    // Create new customer
    const requestBody: any = {
      name,
      email,
      phone: cleanPhone,
      mobilePhone: cleanPhone,
      cpfCnpj: cleanCpfCnpj,
    };

    if (addressData) {
      requestBody.postalCode = addressData.addressZip.replace(/\D/g, '');
      requestBody.address = addressData.addressStreet;
      requestBody.addressNumber = addressData.addressNumber;
      if (addressData.addressComplement) requestBody.complement = addressData.addressComplement;
      requestBody.province = addressData.addressNeighborhood;
    }

    const res = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Error creating Asaas customer:', data);
      throw new Error(`Asaas Customer Error: ${JSON.stringify(data)}`);
    }

    return { id: data.id };
  } catch (error: any) {
    console.error('Error in createAsaasCustomer:', error);
    throw error;
  }
}

export async function createCheckout(
  orderId: string, 
  customerId: string, 
  value: number, 
  description: string,
  billingType: 'PIX' | 'CREDIT_CARD' | 'UNDEFINED' = 'UNDEFINED'
): Promise<string | null> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY not configured.");
  
  console.log('Asaas API Key Check:', { 
    prefix: apiKey.substring(0, 5), 
    length: apiKey.length,
    isExpanded: apiKey.includes('$') && apiKey.length > 10 
  });

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1); // 1 day to expire

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const paymentBody: any = {
      customer: customerId,
      billingType,
      value,
      dueDate: dueDate.toISOString().split('T')[0],
      description,
      externalReference: orderId,
      callback: {
        successUrl: `${appUrl}/checkout/confirmacao?orderId=${orderId}`,
        autoRedirect: true
      }
    };

    const res = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(paymentBody),
    });

    const data = await res.json();
    console.log('Asaas Payment Response:', { status: res.status, data });
    if (!res.ok) {
      console.error('Error creating Asaas payment:', data);
      throw new Error(`Asaas Payment Error: ${JSON.stringify(data)}`);
    }

    return data.invoiceUrl;
  } catch (error: any) {
    console.error('Error in createCheckout:', error);
    throw error;
  }
}
