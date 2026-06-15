// Supabase's JS client uses the WHATWG URL API, which React Native's Hermes
// runtime does not fully implement. Importing this polyfill once at app entry
// (see app/_layout.tsx) makes `new URL(...)` work everywhere downstream.
import 'react-native-url-polyfill/auto';
