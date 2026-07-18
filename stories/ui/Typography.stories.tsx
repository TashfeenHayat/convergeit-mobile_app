import type { Meta, StoryObj } from '@storybook/react-native';

import { Typography } from '@/components/ui/Typography';

const meta = {
  title: 'UI/Typography',
  component: Typography,
  args: {
    children: 'ConvergeIT design system',
    variant: 'medium',
    muted: false,
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'medium',
        'medium16',
        'mediumLarge',
        'small',
        'boldLarge',
        'regularLarge',
        'button',
        'label',
      ],
    },
  },
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {};

export const BoldLarge: Story = {
  args: { variant: 'boldLarge' },
};

export const Muted: Story = {
  args: { muted: true, children: 'Secondary supporting text' },
};
