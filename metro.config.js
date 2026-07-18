/**
 * Storybook Metro wrapper (CJS main.js avoids Windows ESM `d:` crash).
 * Override Storybook's empty `tty`/`os` stubs — those break Expo web SSR
 * (`debug` → `tty.isatty is not a function` → LogBox overlay crash).
 *
 * Storybook is OFF by default so normal app starts stay fast.
 * Enable with: npm run storybook
 */
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const withStorybook = require('@storybook/react-native/metro/withStorybook');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const storybookEnabled = process.env.STORYBOOK_ENABLED === '1';

const storybookConfig = withStorybook(config, {
  enabled: storybookEnabled,
  useJs: true,
  configPath: path.resolve(__dirname, './.rnstorybook'),
  docTools: storybookEnabled,
});

const ttyShim = path.resolve(__dirname, 'metro-shims/tty.js');
const osShim = path.resolve(__dirname, 'metro-shims/os.js');
const storybookEntry = path.resolve(__dirname, 'metro-shims/storybook-entry.js');
const storybookEntryActive = path.resolve(
  __dirname,
  'metro-shims/storybook-entry-active.js',
);
const storybookResolve = storybookConfig.resolver.resolveRequest;

storybookConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tty') {
    return { type: 'sourceFile', filePath: ttyShim };
  }
  if (moduleName === 'os') {
    return { type: 'sourceFile', filePath: osShim };
  }

  // Never pull @storybook/* into the normal app graph.
  const isStorybookEntry =
    moduleName === '../metro-shims/storybook-entry' ||
    moduleName === './metro-shims/storybook-entry' ||
    moduleName.endsWith('metro-shims/storybook-entry') ||
    moduleName.endsWith('metro-shims/storybook-entry.js');

  if (isStorybookEntry) {
    return {
      type: 'sourceFile',
      filePath: storybookEnabled ? storybookEntryActive : storybookEntry,
    };
  }

  if (typeof storybookResolve === 'function') {
    return storybookResolve(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = storybookConfig;
