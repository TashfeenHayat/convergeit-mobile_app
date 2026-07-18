import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  args: {
    children: 'Continue',
    variant: 'primary',
    size: 'default',
    fullWidth: false,
    loading: false,
    disabled: false,
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outlined', 'danger', 'ghost'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'compact'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondary' },
};

export const Outlined: Story = {
  args: { variant: 'outlined', children: 'Outlined' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: 'Delete' },
};

export const FullWidth: Story = {
  args: { fullWidth: true },
  decorators: [
    (Story) => (
      <View style={{ width: '100%' }}>
        <Story />
      </View>
    ),
  ],
};

export const Loading: Story = {
  args: { loading: true },
};
