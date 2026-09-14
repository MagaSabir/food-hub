import {
  distanceKm,
  type GeoPoint,
  isWithinRadius,
} from '../../../orders/domain/rules/distance';

export interface ReachBranch {
  latitude: number | null;
  longitude: number | null;
  hasDelivery: boolean;
  deliveryMaxRadiusKm: number | null;
}

export interface DeliveryReach {
  deliversToAddress: boolean;
  distanceKm: number | null;
}

export const UNKNOWN_REACH: DeliveryReach = {
  deliversToAddress: false,
  distanceKm: null,
};

export function deliveryReach(
  branches: ReachBranch[],
  destination: GeoPoint,
): DeliveryReach {
  const located = branches.filter(
    (branch): branch is ReachBranch & { latitude: number; longitude: number } =>
      branch.latitude !== null && branch.longitude !== null,
  );

  if (located.length === 0) return UNKNOWN_REACH;

  const measured = located.map((branch) => ({
    branch,
    distance: distanceKm(
      { latitude: branch.latitude, longitude: branch.longitude },
      destination,
    ),
  }));

  return {
    deliversToAddress: measured.some(
      ({ branch, distance }) =>
        branch.hasDelivery &&
        isWithinRadius(distance, branch.deliveryMaxRadiusKm),
    ),
    distanceKm: Math.min(...measured.map(({ distance }) => distance)),
  };
}
