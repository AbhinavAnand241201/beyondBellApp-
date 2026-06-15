// Extends Expo's Metro config (required for Expo Router + SDK features).
// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// `@supabase/supabase-js` does an optional dynamic import of `@opentelemetry/api`
// for tracing. It's not a real dependency and isn't installed; Metro resolves
// imports statically and would fail the build. Map it to an empty module — we
// don't use OTEL tracing in the app.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@opentelemetry/api') {
    return { type: 'empty' };
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
