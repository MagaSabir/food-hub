import { formatDistance } from '@/shared/lib/format-distance';
import { formatPrice } from '@/shared/lib/format-price';

export interface DeliveryLabel {
  short: string;
  title: string;
  subtitle: string;
  accent: boolean;
  pickupOnly: boolean;
}

export interface AddressReach {
  deliversToAddress: boolean | null;
  distanceKm: number | null;
}

export function deliveryLabel(
  deliveryFeeFrom: number | null,
  freeDeliveryFrom: number | null,
  reach: AddressReach | null = null,
): DeliveryLabel {
  if (reach?.deliversToAddress === false) {
    const distance =
      reach.distanceKm === null ? null : formatDistance(reach.distanceKm);

    return {
      short: 'Самовывоз',
      title: 'Только самовывоз',
      subtitle: distance ? `до точки ${distance}` : 'сюда не возят',
      accent: false,
      pickupOnly: true,
    };
  }

  if (deliveryFeeFrom === null) {
    return {
      short: 'Самовывоз',
      title: 'Самовывоз',
      subtitle: 'без доставки',
      accent: false,
      pickupOnly: true,
    };
  }

  if (deliveryFeeFrom === 0) {
    return {
      short: 'Бесплатно',
      title: 'Бесплатно',
      subtitle: 'доставка',
      accent: true,
      pickupOnly: false,
    };
  }

  const fee = `от ${formatPrice(deliveryFeeFrom)}`;

  if (freeDeliveryFrom !== null) {
    return {
      short: `Бесплатно от ${formatPrice(freeDeliveryFrom)}`,
      title: fee,
      subtitle: `беспл. от ${formatPrice(freeDeliveryFrom)}`,
      accent: true,
      pickupOnly: false,
    };
  }

  return {
    short: fee,
    title: fee,
    subtitle: 'доставка',
    accent: false,
    pickupOnly: false,
  };
}
