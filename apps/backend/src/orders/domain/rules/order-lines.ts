import { ModifierType } from '@foodhubme/shared';
import { Prisma } from '@prisma/client';
import { MenuItemNotFoundError } from '../../../menu/errors/menu.errors';
import { getEffectivePrice } from '../../../menu/pricing';
import { OrderPolicy } from '../policies/order.policy';
import {
  InvalidModifiersError,
  MenuItemUnavailableError,
  OrderQuantityExceededError,
} from '../errors/orders.errors';

const SINGLE: `${ModifierType}` = ModifierType.SINGLE;

export interface OrderableOption {
  id: string;
  name: string;
  priceDelta: Prisma.Decimal;
  isAvailable: boolean;
}

export interface OrderableGroup {
  id: string;
  name: string;
  type: `${ModifierType}`;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number | null;
  options: OrderableOption[];
}

export interface OrderableItem {
  id: string;
  name: string;
  photos: string[];
  price: Prisma.Decimal;
  discountPrice: Prisma.Decimal | null;
  discountUntil: Date | null;
  isAvailable: boolean;
  modifierGroups: OrderableGroup[];
}

export interface RequestedLine {
  menuItemId: string;
  quantity: number;
  optionIds: string[];
}

export interface OrderModifierSnapshot {
  groupNameSnapshot: string;
  optionNameSnapshot: string;
  priceDeltaSnapshot: Prisma.Decimal;
}

export interface OrderLineSnapshot {
  menuItemId: string;
  nameSnapshot: string;
  photoSnapshot: string | null;
  basePriceSnapshot: Prisma.Decimal;
  quantity: number;
  lineTotal: Prisma.Decimal;
  modifiers: OrderModifierSnapshot[];
}

export interface CalculatedItems {
  lines: OrderLineSnapshot[];
  itemsTotal: Prisma.Decimal;
}

function lineKey(menuItemId: string, optionIds: string[]): string {
  return optionIds.length === 0
    ? menuItemId
    : `${menuItemId}::${[...optionIds].sort().join(',')}`;
}

function mergeDuplicates(requested: RequestedLine[]): RequestedLine[] {
  const merged = new Map<string, RequestedLine>();

  for (const line of requested) {
    const key = lineKey(line.menuItemId, line.optionIds);
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += line.quantity;
    } else {
      merged.set(key, { ...line, optionIds: [...line.optionIds] });
    }
  }

  return [...merged.values()];
}

function resolveModifiers(
  item: OrderableItem,
  optionIds: string[],
): OrderModifierSnapshot[] {
  const chosen = new Set(optionIds);
  const snapshots: OrderModifierSnapshot[] = [];
  let matched = 0;

  for (const group of item.modifierGroups) {
    const selected = group.options.filter((option) => chosen.has(option.id));
    matched += selected.length;

    const soldOut = selected.find((option) => !option.isAvailable);
    if (soldOut) {
      throw new InvalidModifiersError(
        `«${soldOut.name}» закончилось — выберите другой вариант для «${item.name}»`,
      );
    }

    const max = group.type === SINGLE ? 1 : (group.maxSelections ?? Infinity);
    if (selected.length > max) {
      throw new InvalidModifiersError(
        `«${group.name}»: можно выбрать не больше ${max}`,
      );
    }

    const min = group.isRequired
      ? Math.max(1, group.minSelections)
      : group.minSelections;
    if ((group.isRequired || selected.length > 0) && selected.length < min) {
      throw new InvalidModifiersError(
        `«${group.name}»: нужно выбрать минимум ${min}`,
      );
    }

    for (const option of selected) {
      snapshots.push({
        groupNameSnapshot: group.name,
        optionNameSnapshot: option.name,
        priceDeltaSnapshot: option.priceDelta,
      });
    }
  }

  if (matched !== chosen.size) {
    throw new InvalidModifiersError(
      `Для «${item.name}» выбран вариант, которого нет в его модификаторах`,
    );
  }

  return snapshots;
}

export function calculateOrderItems(
  requested: RequestedLine[],
  menu: OrderableItem[],
  now: Date,
): CalculatedItems {
  const byId = new Map(menu.map((item) => [item.id, item]));
  const lines: OrderLineSnapshot[] = [];
  let itemsTotal = new Prisma.Decimal(0);

  for (const line of mergeDuplicates(requested)) {
    const item = byId.get(line.menuItemId);
    if (!item) throw new MenuItemNotFoundError(line.menuItemId);

    if (!item.isAvailable) throw new MenuItemUnavailableError(item.name);

    if (line.quantity > OrderPolicy.MAX_QUANTITY_PER_LINE) {
      throw new OrderQuantityExceededError(
        item.name,
        OrderPolicy.MAX_QUANTITY_PER_LINE,
      );
    }

    const modifiers = resolveModifiers(item, line.optionIds);

    const { price } = getEffectivePrice(item, now);

    const perUnit = modifiers.reduce(
      (sum, modifier) => sum.plus(modifier.priceDeltaSnapshot),
      price,
    );
    const safePerUnit = perUnit.isNegative() ? new Prisma.Decimal(0) : perUnit;
    const lineTotal = safePerUnit.mul(line.quantity);

    lines.push({
      menuItemId: item.id,
      nameSnapshot: item.name,
      photoSnapshot: item.photos[0] ?? null,
      basePriceSnapshot: price,
      quantity: line.quantity,
      lineTotal,
      modifiers,
    });

    itemsTotal = itemsTotal.plus(lineTotal);
  }

  return { lines, itemsTotal };
}
