import type { Meta, StoryObj } from '@storybook/react-native';

import { InputField } from '@/components/ui/InputField';

const meta = {
  title: 'UI/InputField',
  component: InputField,
  args: {
    label: 'Email',
    placeholder: 'you@company.com',
    error: false,
    helperText: '',
  },
} satisfies Meta<typeof InputField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Password: Story = {
  args: {
    label: 'Password',
    placeholder: '••••••••',
    secureTextEntry: true,
  },
};

export const WithError: Story = {
  args: {
    error: true,
    helperText: 'Enter a valid email address',
    value: 'bad-email',
  },
};
