/**
 * Default Storybook route when STORYBOOK_ENABLED is off.
 * Keeps expo-router happy without loading @storybook/* (which crashes in RN).
 */
const React = require('react');
const { Redirect } = require('expo-router');

function StorybookDisabled() {
  return React.createElement(Redirect, { href: '/' });
}

module.exports = StorybookDisabled;
module.exports.default = StorybookDisabled;
