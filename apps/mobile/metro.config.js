// Expo monorepo Metro config.
// https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo so changes in packages/* hot-reload the mobile app.
config.watchFolders = [workspaceRoot];

// Resolve modules from both the local and the root node_modules (hoisted).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Prevent "duplicate" React copies from hoisted + nested installs.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
