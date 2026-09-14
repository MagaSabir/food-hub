import { ModifierType, type ModifierGroupInfo } from '@foodhubme/shared';

export type Selection = Record<string, string[]>;

export interface SelectedOption {
  id: string;
  name: string;
  priceDelta: number;
  groupName: string;
}

const isPickable = (option: { isAvailable: boolean }): boolean =>
  option.isAvailable;

export function initSelection(groups: ModifierGroupInfo[]): Selection {
  const selection: Selection = {};

  for (const group of groups) {
    const first = group.options.find(isPickable);
    selection[group.id] =
      group.isRequired && group.type === ModifierType.SINGLE && first
        ? [first.id]
        : [];
  }

  return selection;
}

export function toggleOption(
  selection: Selection,
  group: ModifierGroupInfo,
  optionId: string,
): Selection {
  const current = selection[group.id] ?? [];
  const option = group.options.find((o) => o.id === optionId);
  if (!option || !isPickable(option)) return selection;

  if (group.type === ModifierType.SINGLE) {
    const next =
      current.includes(optionId) && !group.isRequired ? [] : [optionId];
    return { ...selection, [group.id]: next };
  }

  if (current.includes(optionId)) {
    return {
      ...selection,
      [group.id]: current.filter((id) => id !== optionId),
    };
  }

  if (group.maxSelections !== null && current.length >= group.maxSelections) {
    return selection;
  }

  return { ...selection, [group.id]: [...current, optionId] };
}

export function isGroupFull(
  group: ModifierGroupInfo,
  selection: Selection,
): boolean {
  if (group.type === ModifierType.SINGLE) return false;
  const count = (selection[group.id] ?? []).length;
  return group.maxSelections !== null && count >= group.maxSelections;
}

export function isGroupSatisfied(
  group: ModifierGroupInfo,
  selection: Selection,
): boolean {
  const count = (selection[group.id] ?? []).length;
  const required = group.isRequired
    ? Math.max(1, group.minSelections)
    : group.minSelections;
  return count >= required;
}

export function canSubmit(
  groups: ModifierGroupInfo[],
  selection: Selection,
): boolean {
  return groups.every((group) => isGroupSatisfied(group, selection));
}

export function selectedOptions(
  groups: ModifierGroupInfo[],
  selection: Selection,
): SelectedOption[] {
  return groups.flatMap((group) =>
    group.options
      .filter((option) => (selection[group.id] ?? []).includes(option.id))
      .map((option) => ({
        id: option.id,
        name: option.name,
        priceDelta: option.priceDelta,
        groupName: group.name,
      })),
  );
}

export function unitPrice(
  basePrice: number,
  options: SelectedOption[],
): number {
  return options.reduce((sum, option) => sum + option.priceDelta, basePrice);
}
