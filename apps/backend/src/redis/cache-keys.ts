export const CACHE_PREFIX = 'cache:v2';

export const CacheKeys = {
  catalog: (): string => `${CACHE_PREFIX}:catalog`,
  restaurant: (slug: string): string => `${CACHE_PREFIX}:restaurant:${slug}`,
  brandMenu: (slug: string): string => `${CACHE_PREFIX}:menu:${slug}`,
  menuItem: (id: string): string => `${CACHE_PREFIX}:menu-item:${id}`,
} as const;

export const CacheTtl = {
  CATALOG: 60,
  RESTAURANT: 60,
  MENU: 60,
  MENU_ITEM: 60,
} as const;
