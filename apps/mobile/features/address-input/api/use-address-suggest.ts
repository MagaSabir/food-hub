import { useQuery } from '@tanstack/react-query';
import { PILOT_CITY } from '@/shared/config/city';

export interface AddressSuggestion {
  id: string;
  title: string;
  subtitle: string;
  locality: string | null;
  latitude: number;
  longitude: number;
}

interface PhotonResponse {
  features?: {
    geometry?: { coordinates?: [number, number] };
    properties?: {
      name?: string;
      street?: string;
      housenumber?: string;
      city?: string;
      district?: string;
      state?: string;
      osm_id?: number;
      osm_key?: string;
      osm_value?: string;
    };
  }[];
}

const SETTLEMENT_TYPES = new Set(['city', 'town', 'village', 'hamlet']);

const MIN_QUERY_LENGTH = 3;

export function useAddressSuggest(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['address-suggest', trimmed],
    queryFn: () => fetchSuggestions(trimmed),
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

async function fetchSuggestions(query: string): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    limit: '6',
    lat: String(PILOT_CITY.latitude),
    lon: String(PILOT_CITY.longitude),
    bbox: PILOT_CITY.searchBbox.join(','),
  });

  const response = await fetch(`https://photon.komoot.io/api/?${params}`);
  if (!response.ok) {
    throw new Error('Поиск адреса сейчас недоступен');
  }

  const body = (await response.json()) as PhotonResponse;

  return (body.features ?? [])
    .map(toSuggestion)
    .filter((item): item is AddressSuggestion => item !== null);
}

function toSuggestion(
  feature: NonNullable<PhotonResponse['features']>[number],
): AddressSuggestion | null {
  const coordinates = feature.geometry?.coordinates;
  const properties = feature.properties;
  if (!coordinates || !properties) return null;
  const [longitude, latitude] = coordinates;

  const street = properties.street ?? properties.name;
  if (!street) return null;

  const title = properties.housenumber
    ? `${street}, ${properties.housenumber}`
    : street;

  const isPlace =
    properties.osm_key === 'place' &&
    SETTLEMENT_TYPES.has(properties.osm_value ?? '');
  const locality =
    properties.city ?? (isPlace ? (properties.name ?? null) : null);

  const subtitle = [isPlace ? null : locality, properties.state]
    .filter(Boolean)
    .join(', ');

  return {
    id: `${properties.osm_id ?? title}:${latitude},${longitude}`,
    title,
    subtitle,
    locality,
    latitude,
    longitude,
  };
}
