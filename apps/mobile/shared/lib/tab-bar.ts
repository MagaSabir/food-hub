export const TAB_BAR_HEIGHT = 64;

const BREATHING_ROOM = 24;

export function tabBarContentPadding(bottomInset: number): number {
  return bottomInset + TAB_BAR_HEIGHT + BREATHING_ROOM;
}
