import type { LayoutConfig, LayoutId } from '@/types';

export const LAYOUTS: Record<LayoutId, LayoutConfig> = {
  '3-2': {
    id: '3-2',
    label: '3-2 (Narrow-body)',
    columnGroups: [
      ['A', 'B', 'C'],
      ['D', 'E'],
    ],
    rows: 20,
  },
  '2-3-2': {
    id: '2-3-2',
    label: '2-3-2 (Wide-body)',
    columnGroups: [
      ['A', 'B'],
      ['C', 'D', 'E'],
      ['F', 'G'],
    ],
    rows: 20,
  },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS) as LayoutId[];
