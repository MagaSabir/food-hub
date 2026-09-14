import { useEffect } from 'react';
import { useSavedAddresses } from '../api/use-saved-addresses';
import { useAddressStore } from './address-store';

export function useDefaultAddress(): void {
  const { data: saved } = useSavedAddresses();
  const address = useAddressStore((state) => state.address);
  const setAddress = useAddressStore((state) => state.setAddress);

  useEffect(() => {
    if (address !== null) return;

    const preferred = saved?.[0];
    if (!preferred) return;

    setAddress({
      address: preferred.address,
      locality: preferred.locality,
      details: preferred.details,
      latitude: preferred.latitude,
      longitude: preferred.longitude,
    });
  }, [saved, address, setAddress]);
}
