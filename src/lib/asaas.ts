const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

interface AsaasCustomer {
  id: string;
}

interface AsaasPayment {
  id: string;
  status: string;
  billingType: string;
  externalReference: string;
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
  const cleanPhone = phone.replace(/\D/g, '');

  // O código do país (55) foi removido pois o Asaas interpreta como DDD.


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
        const customerId = searchData.data[0].id;
        const updateBody: any = {
          name,
          phone: cleanPhone,
          mobilePhone: cleanPhone,
          cpfCnpj: cleanCpfCnpj,
        };
        
        // Update customer with the latest address to prevent manual input during checkout
        if (addressData) {
          updateBody.postalCode = addressData.addressZip.replace(/\D/g, '');
          updateBody.address = addressData.addressStreet;
          updateBody.addressNumber = addressData.addressNumber;
          updateBody.province = addressData.addressNeighborhood;
          if (addressData.addressComplement) updateBody.complement = addressData.addressComplement;
        }
        
        await fetch(`${ASAAS_API_URL}/customers/${customerId}`, {
          method: 'POST', // Asaas uses POST /customers/{id} for updates
          headers: {
            'Content-Type': 'application/json',
            'access_token': apiKey,
          },
          body: JSON.stringify(updateBody),
        });
        
        return { id: customerId };
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
  // dueDate.setDate(dueDate.getDate() + 1); // Removido: Restaurantes precisam de vencimento no mesmo dia

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
        autoRedirect: true // Restaurado para true. Em false o Asaas nem sequer tenta redirecionar e também não mostra o botão.
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

/**
 * Query Asaas API directly for payment status by externalReference (orderId).
 * Used as fallback when webhook doesn't arrive or arrives before order exists.
 */
export async function getPaymentByExternalReference(orderId: string): Promise<AsaasPayment | null> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY not configured.");

  try {
    const res = await fetch(
      `${ASAAS_API_URL}/payments?externalReference=${encodeURIComponent(orderId)}`,
      {
        headers: { 'access_token': apiKey },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      console.error('Error fetching Asaas payment:', await res.text());
      return null;
    }

    const data = await res.json();
    if (data.data && data.data.length > 0) {
      const payment = data.data[0];
      return {
        id: payment.id,
        status: payment.status,
        billingType: payment.billingType,
        externalReference: payment.externalReference,
      };
    }

    return null;
  } catch (error) {
    console.error('Error in getPaymentByExternalReference:', error);
    return null;
  }
}

/**
 * Refund a payment in Asaas.
 * @param paymentId The Asaas payment ID (e.g. pay_xxxxx)
 */
export async function refundPayment(paymentId: string): Promise<boolean> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY not configured.");

  try {
    const res = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      }
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error refunding Asaas payment:', errorData);
      throw new Error(`Asaas Refund Error: ${errorData}`);
    }

    return true;
  } catch (error) {
    console.error('Error in refundPayment:', error);
    throw error;
  }
}

/**
 * Delete a pending payment in Asaas.
 * @param paymentId The Asaas payment ID (e.g. pay_xxxxx)
 */
export async function deletePayment(paymentId: string): Promise<boolean> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY not configured.");

  try {
    const res = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
      method: 'DELETE',
      headers: {
        'access_token': apiKey,
      }
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error('Error deleting Asaas payment:', errorData);
      throw new Error(`Asaas Delete Error: ${errorData}`);
    }

    return true;
  } catch (error) {
    console.error('Error in deletePayment:', error);
    throw error;
  }
}


