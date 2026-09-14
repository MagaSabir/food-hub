import { create } from 'zustand';
import { PILOT_CITY } from '@/shared/config/city';

export interface DeliveryAddress {
  address: string;
  locality: string | null;
  details: string | null;
  latitude: number;
  longitude: number;
}

interface AddressState {
  address: DeliveryAddress | null;
  setAddress: (address: DeliveryAddress) => void;
  clear: () => void;
}

export function fullAddress(place: {
  address: string;
  locality: string | null;
}): string {
  const { locality, address } = place;
  if (!locality || locality === PILOT_CITY.name) return address;
  if (locality === address) return address;
  return `${locality}, ${address}`;
}
export const useAddressStore = create<AddressState>((set) => ({
  address: null,
  setAddress: (address) => set({ address }),
  clear: () => set({ address: null }),
}));
