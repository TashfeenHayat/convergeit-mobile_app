import type { Meta, StoryObj } from '@storybook/react-native';

import { AuthShell } from '@/components/auth/AuthShell';
import { Button, InputField } from '@/components/ui';

const meta = {
  title: 'Auth/AuthShell',
  component: AuthShell,
} satisfies Meta<typeof AuthShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    heading: 'Sign in',
    subheading: 'Welcome back to ConvergeIT.',
    children: null,
  },
  render: (args) => (
    <AuthShell heading={args.heading} subheading={args.subheading}>
      <InputField label="Email" placeholder="you@company.com" />
      <Button fullWidth>Sign in</Button>
    </AuthShell>
  ),
};
