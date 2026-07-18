/** Metro shim — Node `tty` for RN / web SSR (Storybook empties this and breaks `debug.isatty`). */
module.exports = {
  isatty: () => false,
  ReadStream: function ReadStream() {},
  WriteStream: function WriteStream() {},
};
