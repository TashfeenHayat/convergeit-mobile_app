import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

export type DataTableIconName = ComponentProps<typeof Ionicons>['name'];

export interface DataTableColumn<T = Record<string, unknown>> {
  /** Unique key matching row data */
  id: string;
  /** Header label (ignored when `headerRender` is set) */
  label: string;
  /** Optional custom header cell */
  headerRender?: () => ReactNode;
  /** Cell text style: default (white) or muted (gray) */
  cellVariant?: 'default' | 'muted';
  /** Header and body horizontal alignment */
  align?: 'left' | 'center' | 'right';
  /** Optional fixed column width */
  width?: number;
  /** Optional minimum column width */
  minWidth?: number;
  /** Keep cell content on one line */
  nowrap?: boolean;
  /** Optional custom cell render: (value, row, index) => ReactNode */
  render?: (value: unknown, row: T, index: number) => ReactNode;
}

export interface DataTableEmptyState {
  title?: string;
  description?: string;
  /** Ionicons name for the empty-state icon well */
  icon?: DataTableIconName;
}

export interface DataTableProps<T = Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  loadingRowCount?: number;
  getRowId?: (row: T, index: number) => string | number;
  selectedRowId?: string | number | null;
  onRowClick?: (row: T, index: number) => void;
  actionColumn?: {
    label: string;
    align?: 'left' | 'center' | 'right';
    width?: number;
    render: (row: T, index: number) => ReactNode;
  };
  /** Minimum table width so wide tables scroll horizontally */
  minWidth?: number;
  size?: 'small' | 'medium';
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  emptyState?: DataTableEmptyState;
}

export type DataTableActionButtonStyle = {
  color: string;
};
