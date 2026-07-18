import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { View } from 'react-native';

import {
  AppCard,
  Checkbox,
  Divider,
  LoadingScreen,
  SegmentedControl,
  TextLink,
  Typography,
} from '@/components/ui';

const meta = {
  title: 'UI/Primitives',
  component: View,
} satisfies Meta<typeof View>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AppCardExample: Story = {
  render: () => (
    <AppCard>
      <Typography variant="mediumLarge">Glass card</Typography>
      <Typography variant="medium" muted style={{ marginTop: 8 }}>
        Matches web AppCard surface + border tokens.
      </Typography>
    </AppCard>
  ),
};

export const CheckboxExample: Story = {
  render: function CheckboxStory() {
    const [checked, setChecked] = useState(true);
    return <Checkbox checked={checked} onChange={setChecked} label="Remember me" />;
  },
};

export const DividerExample: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Typography>Above</Typography>
      <Divider />
      <Typography>Below</Typography>
    </View>
  ),
};

export const TextLinkExample: Story = {
  render: () => <TextLink onPress={() => undefined}>Forgot password?</TextLink>,
};

export const SegmentedControlExample: Story = {
  render: function SegmentStory() {
    const [value, setValue] = useState('day');
    return (
      <SegmentedControl
        value={value}
        onChange={setValue}
        options={[
          { label: 'Day', value: 'day' },
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' },
        ]}
      />
    );
  },
};

export const LoadingScreenExample: Story = {
  render: () => <LoadingScreen message="Loading…" fullPage={false} />,
};
