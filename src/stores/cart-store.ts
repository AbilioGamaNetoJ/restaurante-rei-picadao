import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItemAddon {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  comment?: string;
  addons: CartItemAddon[];
  subtotal: number;
}

export interface CheckoutData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCpfCnpj: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  distanceKm: number;
  deliveryFee: number;
  lat?: number;
  lng?: number;
}

interface CartState {
  items: CartItem[];
  checkoutData: CheckoutData | null;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setCheckoutData: (data: CheckoutData) => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      checkoutData: null,
      isDrawerOpen: false,
      setDrawerOpen: (open) => set({ isDrawerOpen: open }),
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        })),
      clearCart: () => set({ items: [], checkoutData: null }),
      setCheckoutData: (data) => set({ checkoutData: data }),
      getTotal: () => {
        return get().items.reduce((total, item) => {
          const itemTotal = item.price * item.quantity;
          const addonsTotal = item.addons.reduce(
            (sum, addon) => sum + addon.price * addon.quantity,
            0
          );
          return total + itemTotal + addonsTotal;
        }, 0);
      },
    }),
    {
      name: 'rei-do-picadao-cart',
    }
  )
);
