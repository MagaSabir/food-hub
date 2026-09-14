import type { PromoBannerData } from '../ui/promo-banners';

export const MOCK_HAS_UNREAD = true;

export const MOCK_BANNERS: PromoBannerData[] = [
  { id: 'combo-23', image: require('@/assets/banners/img.png') },
  { id: 'combo-20', image: require('@/assets/banners/promo-combo-20.png') },
  {
    id: 'free-delivery',
    image: require('@/assets/banners/promo-free-delivery.png'),
  },
  { id: 'combo-22', image: require('@/assets/banners/promo-combo-20.png') },
];
