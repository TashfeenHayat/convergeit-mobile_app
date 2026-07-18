/** Active Storybook UI — only resolved when STORYBOOK_ENABLED=1. */
const mod = require('../.rnstorybook');
const StorybookUI = mod.default ?? mod;
module.exports = StorybookUI;
module.exports.default = StorybookUI;
