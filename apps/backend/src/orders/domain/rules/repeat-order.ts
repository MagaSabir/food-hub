import {
  RepeatSkipReason,
  type RepeatItemView,
  type RepeatSkippedView,
} from '@foodhubme/shared';

export interface CurrentOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface CurrentGroup {
  name: string;
  options: CurrentOption[];
}

export interface CurrentDish {
  id: string;
  name: string;
  photoUrl: string | null;
  price: number;
  isAvailable: boolean;
  groups: CurrentGroup[];
}

export interface OrderedLine {
  menuItemId: string | null;
  name: string;
  quantity: number;
  modifiers: { groupName: string; optionName: string }[];
}

export interface RepeatPlan {
  items: RepeatItemView[];
  skipped: RepeatSkippedView[];
}

export function planRepeat(
  lines: OrderedLine[],
  menu: Map<string, CurrentDish>,
): RepeatPlan {
  const items: RepeatItemView[] = [];
  const skipped: RepeatSkippedView[] = [];

  for (const line of lines) {
    const dish =
      line.menuItemId === null ? undefined : menu.get(line.menuItemId);

    if (!dish) {
      skipped.push({ name: line.name, reason: RepeatSkipReason.REMOVED });
      continue;
    }

    if (!dish.isAvailable) {
      skipped.push({ name: dish.name, reason: RepeatSkipReason.UNAVAILABLE });
      continue;
    }

    const options = matchOptions(line, dish);

    if (options === null) {
      skipped.push({ name: dish.name, reason: RepeatSkipReason.CHANGED });
      continue;
    }

    items.push({
      menuItemId: dish.id,
      name: dish.name,
      photoUrl: dish.photoUrl,
      price: dish.price + options.reduce((sum, o) => sum + o.priceDelta, 0),
      quantity: line.quantity,
      options,
    });
  }

  return { items, skipped };
}

function matchOptions(
  line: OrderedLine,
  dish: CurrentDish,
): RepeatOptionMatch[] | null {
  const matched: RepeatOptionMatch[] = [];

  for (const snapshot of line.modifiers) {
    const group = dish.groups.find((g) => g.name === snapshot.groupName);
    const option = group?.options.find((o) => o.name === snapshot.optionName);

    if (!group || !option) return null;

    matched.push({
      id: option.id,
      name: option.name,
      groupName: group.name,
      priceDelta: option.priceDelta,
    });
  }

  return matched;
}

type RepeatOptionMatch = RepeatItemView['options'][number];
