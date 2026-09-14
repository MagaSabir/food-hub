
export interface UserAddressView {
  id: string;
  address: string;
  locality: string | null;
  details: string | null;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface SaveAddressRequest {
  address: string;
  locality?: string | null;
  details?: string | null;
  latitude: number;
  longitude: number;
}

export const MAX_SAVED_ADDRESSES = 3;
