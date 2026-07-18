/** Metro shim — Node `os` for RN / web SSR (Storybook empties this module). */
module.exports = {
  EOL: '\n',
  platform: () => 'browser',
  arch: () => 'web',
  homedir: () => '/',
  tmpdir: () => '/tmp',
  hostname: () => 'localhost',
  type: () => 'Browser',
  release: () => '0',
  cpus: () => [],
  networkInterfaces: () => ({}),
  freemem: () => 0,
  totalmem: () => 0,
  endianness: () => 'LE',
};
