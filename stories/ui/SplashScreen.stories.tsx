import type { Meta, StoryObj } from '@storybook/react-native';

import { SplashScreen } from '@/components/ui/SplashScreen';

const meta = {
  title: 'UI/SplashScreen',
  component: SplashScreen,
  args: {
    message: 'Loading workspace…',
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SplashScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { message: undefined },
};

export const WithMessage: Story = {};
