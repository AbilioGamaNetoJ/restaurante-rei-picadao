const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_TIMEOUT_MS = 10_000;

function asaasFetch(url: string, init?: RequestInit) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(ASAAS_TIMEOUT_MS) });
}

function errorName(error: unknown) {
  return error instanceof Error ? error.name : 'UnknownError';
}

interface AsaasCustomer {
  id: string;
}

interface AsaasPayment {
  id: string;
  status: string;
  billingType: string;
  externalReference: string;
}

type AsaasCustomerUpdate = {
  phone: string;
  mobilePhone: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  province?: string;
  complement?: string;
};

type AsaasCustomerCreate = AsaasCustomerUpdate & {
  name: string;
  email: string;
  cpfCnpj: string;
};

type CustomerAddress = {
  addressZip: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
};

type AsaasCheckoutCreate = {
  customer: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'UNDEFINED';
  value: number;
  dueDate: string;
  description: string;
  externalReference: string;
  callback: { successUrl: string; autoRedirect: boolean };
};

function getAddressFields(addressData?: CustomerAddress): Partial<AsaasCustomerUpdate> {
  if (!addressData) return {};

  return {
    postalCode: addressData.addressZip.replace(/\D/g, ''),
    address: addressData.addressStreet,
    addressNumber: addressData.addressNumber,
    province: addressData.addressNeighborhood,
    ...(addressData.addressComplement ? { complement: addressData.addressComplement } : {}),
  };
}

async function findCustomerByEmail(email: string, apiKey: string): Promise<AsaasCustomer | null> {
  const response = await asaasFetch(`${ASAAS_API_URL}/customers?email=${encodeURIComponent(email)}`, {
    headers: { access_token: apiKey },
  });
  if (!response.ok) return null;

  const data = await response.json() as { data?: AsaasCustomer[] };
  return data.data?.[0] ?? null;
}

async function updateAsaasCustomer(
  customerId: string,
  cleanPhone: string,
  addressData: CustomerAddress | undefined,
  apiKey: string,
) {
  const response = await asaasFetch(`${ASAAS_API_URL}/customers/${customerId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', access_token: apiKey },
    body: JSON.stringify({
      phone: cleanPhone,
      mobilePhone: cleanPhone,
      ...getAddressFields(addressData),
    } satisfies AsaasCustomerUpdate),
  });

  if (!response.ok) {
    console.error('Asaas customer update failed', { status: response.status });
  }
}

async function createNewAsaasCustomer(
  name: string,
  email: string,
  cleanPhone: string,
  cleanCpfCnpj: string,
  addressData: CustomerAddress | undefined,
  apiKey: string,
): Promise<AsaasCustomer> {
  const response = await asaasFetch(`${ASAAS_API_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', access_token: apiKey },
    body: JSON.stringify({
      name,
      email,
      phone: cleanPhone,
      mobilePhone: cleanPhone,
      cpfCnpj: cleanCpfCnpj,
      ...getAddressFields(addressData),
    } satisfies AsaasCustomerCreate),
  });
  const data = await response.json() as AsaasCustomer;

  if (!response.ok) {
    console.error('Asaas customer creation failed', { status: response.status });
    throw new Error('Asaas Customer Error');
  }

  return { id: data.id };
}

export async function createAsaasCustomer(
  name: string,
  email: string,
  phone: string,
  cpfCnpj: string,
  addressData?: CustomerAddress,
): Promise<AsaasCustomer | null> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    console.error('ASAAS_API_KEY is missing from process.env');
    throw new Error("ASAAS_API_KEY not configured. Please check your .env file and restart the server.");
  }

  const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');
  const cleanPhone = phone.replace(/\D/g, '');

  try {
    const existingCustomer = await findCustomerByEmail(email, apiKey);
    if (existingCustomer) {
      await updateAsaasCustomer(existingCustomer.id, cleanPhone, addressData, apiKey);
      return existingCustomer;
    }

    return await createNewAsaasCustomer(name, email, cleanPhone, cleanCpfCnpj, addressData, apiKey);
  } catch (error: unknown) {
    console.error('Asaas customer operation failed', { reason: errorName(error) });
    throw error;
  }
}

export async function createCheckout(
  orderId: string, 
  customerId: string, 
  value: number, 
  description: string,
  trackingToken: string,
  billingType: 'PIX' | 'CREDIT_CARD' | 'UNDEFINED' = 'UNDEFINED'
): Promise<{ invoiceUrl: string, paymentId: string } | null> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY not configured.");
  
  const dueDate = new Date();
  // dueDate.setDate(dueDate.getDate() + 1); // Removido: Restaurantes precisam de vencimento no mesmo dia

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const paymentBody: AsaasCheckoutCreate = {
      customer: customerId,
      billingType,
      value,
      dueDate: dueDate.toISOString().split('T')[0],
      description,
      externalReference: orderId,
      callback: {
        successUrl: `${appUrl}/checkout/confirmacao?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(trackingToken)}`,
        autoRedirect: true // Restaurado para true. Em false o Asaas nem sequer tenta redirecionar e também não mostra o botão.
      }
    };

    const res = await asaasFetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(paymentBody),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Asaas payment creation failed', { status: res.status });
      throw new Error('Asaas Payment Error');
    }

    return { invoiceUrl: data.invoiceUrl, paymentId: data.id };
  } catch (error: unknown) {
    console.error('Asaas checkout operation failed', { reason: errorName(error) });
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
    const res = await asaasFetch(
      `${ASAAS_API_URL}/payments?externalReference=${encodeURIComponent(orderId)}`,
      {
        headers: { 'access_token': apiKey },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      console.error('Asaas payment lookup failed', { status: res.status });
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
  } catch (error: unknown) {
    console.error('Asaas payment lookup failed', { reason: errorName(error) });
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
    const res = await asaasFetch(`${ASAAS_API_URL}/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      }
    });

    if (!res.ok) {
      console.error('Asaas payment refund failed', { status: res.status });
      throw new Error('Asaas Refund Error');
    }

    return true;
  } catch (error: unknown) {
    console.error('Asaas payment refund failed', { reason: errorName(error) });
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
    const res = await asaasFetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
      method: 'DELETE',
      headers: {
        'access_token': apiKey,
      }
    });

    if (!res.ok) {
      console.error('Asaas payment deletion failed', { status: res.status });
      throw new Error('Asaas Delete Error');
    }

    return true;
  } catch (error: unknown) {
    console.error('Asaas payment deletion failed', { reason: errorName(error) });
    throw error;
  }
}
