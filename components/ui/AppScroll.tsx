import { forwardRef, type ComponentRef, type Ref } from 'react';
import {
  FlatList,
  ScrollView,
  SectionList,
  type FlatListProps,
  type ScrollViewProps,
  type SectionListProps,
} from 'react-native';

type ScrollViewRef = ComponentRef<typeof ScrollView>;
type FlatListRef = ComponentRef<typeof FlatList>;
type SectionListRef = ComponentRef<typeof SectionList>;

/**
 * App-wide scroll defaults — vertical scrollbar hidden on every page.
 * Prefer these over raw RN ScrollView / FlatList / SectionList so pages stay consistent.
 */
export const AppScrollView = forwardRef(function AppScrollView(
  {
    showsVerticalScrollIndicator = false,
    showsHorizontalScrollIndicator = false,
    ...rest
  }: ScrollViewProps,
  ref: Ref<ScrollViewRef>,
) {
  return (
    <ScrollView
      ref={ref}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      {...rest}
    />
  );
});

export const AppFlatList = forwardRef(function AppFlatList(
  {
    showsVerticalScrollIndicator = false,
    showsHorizontalScrollIndicator = false,
    ...rest
  }: FlatListProps<unknown>,
  ref: Ref<FlatListRef>,
) {
  return (
    <FlatList
      ref={ref}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      {...(rest as FlatListProps<unknown>)}
    />
  );
}) as typeof FlatList;

export const AppSectionList = forwardRef(function AppSectionList(
  {
    showsVerticalScrollIndicator = false,
    showsHorizontalScrollIndicator = false,
    ...rest
  }: SectionListProps<unknown>,
  ref: Ref<SectionListRef>,
) {
  return (
    <SectionList
      ref={ref}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      {...(rest as SectionListProps<unknown>)}
    />
  );
}) as typeof SectionList;
