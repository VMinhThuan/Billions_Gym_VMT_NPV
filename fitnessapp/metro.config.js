const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Tùy chỉnh nếu cần (optional)
config.resolver.assetExts.push('db');

module.exports = config;