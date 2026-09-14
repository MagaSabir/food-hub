
export enum RepeatSkipReason {
  REMOVED = 'REMOVED',
  UNAVAILABLE = 'UNAVAILABLE',
  CHANGED = 'CHANGED',
}

export interface RepeatOptionView {
  id: string;
  name: string;
  groupName: string;
  priceDelta: number;
}

export interface RepeatItemView {
  menuItemId: string;
  name: string;
  photoUrl: string | null;
  price: number;
  quantity: number;
  options: RepeatOptionView[];
}

export interface RepeatSkippedView {
  name: string;
  reason: RepeatSkipReason;
}

export interface RepeatOrderView {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  items: RepeatItemView[];
  skipped: RepeatSkippedView[];
}
