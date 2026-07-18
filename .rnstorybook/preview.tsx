import type { Preview } from '@storybook/react-native';
import { View } from 'react-native';

import { AppProviders } from '@/components/app-root/AppProviders';
import { appColors } from '@/theme';

const preview: Preview = {
  decorators: [
    (Story) => (
      <AppProviders>
        <View
          style={{
            flex: 1,
            padding: 16,
            justifyContent: 'center',
            backgroundColor: appColors.background.bottom,
          }}
        >
          <Story />
        </View>
      </AppProviders>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
