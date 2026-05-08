const ASAAS_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.asaas.com/v3' 
  : 'https://sandbox.asaas.com/api/v3';

interface AsaasCustomer {
  id: string;
}

export async function createAsaasCustomer(name: string, email: string, phone: string): Promise<AsaasCustomer | null> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY not configured.");

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
        return { id: searchData.data[0].id };
      }
    }

    // Create new customer
    const res = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify({
        name,
        email,
        phone,
      }),
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

export async function createCheckout(orderId: string, customerId: string, value: number, description: string): Promise<string | null> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY not configured.");

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1); // 1 day to expire

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const res = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'UNDEFINED',
        value,
        dueDate: dueDate.toISOString().split('T')[0],
        description,
        externalReference: orderId,
        callback: {
          successUrl: `${appUrl}/checkout/confirmacao?orderId=${orderId}`,
        }
      }),
    });

    const data = await res.json();
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
