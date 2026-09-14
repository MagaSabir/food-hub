import { SEARCH_MIN_QUERY_LENGTH } from '@foodhubme/shared';

export const SearchPolicy = {
  MIN_QUERY_LENGTH: SEARCH_MIN_QUERY_LENGTH,

  MAX_QUERY_LENGTH: 60,

  MAX_RESTAURANTS: 20,
  MAX_DISHES: 30,
} as const;
