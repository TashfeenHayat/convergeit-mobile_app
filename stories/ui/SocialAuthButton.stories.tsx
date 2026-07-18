import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';

import { SocialAuthButton } from '@/components/ui/SocialAuthButton';

const meta = {
  title: 'UI/SocialAuthButton',
  component: SocialAuthButton,
  args: {
    provider: 'google' as const,
  },
} satisfies Meta<typeof SocialAuthButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Google: Story = {};

export const Row: Story = {
  args: {
    provider: 'google',
  },
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <SocialAuthButton provider="google" />
      <SocialAuthButton provider="github" />
      <SocialAuthButton provider="facebook" />
    </View>
  ),
};
