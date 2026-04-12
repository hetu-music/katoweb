/// <reference lib="webworker" />

import {
  CacheFirst,
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
  type PrecacheEntry,
  type SerwistGlobalConfig,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.origin === "https://fonts.googleapis.com",
      handler: new StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
      }),
    },
    {
      matcher: ({ url }) => url.origin === "https://fonts.gstatic.com",
      handler: new CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          }),
        ],
      }),
    },
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: "next-static-assets",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          }),
        ],
      }),
    },
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && url.pathname === "/_next/image",
      handler: new StaleWhileRevalidate({
        cacheName: "next-optimized-images",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 60,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          }),
        ],
      }),
    },
    {
      matcher: ({ url }) => url.origin === "https://cover.hetu-music.com",
      handler: new CacheFirst({
        cacheName: "cover-images",
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          }),
        ],
      }),
    },
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && url.pathname.startsWith("/api/"),
      handler: new NetworkFirst({
        cacheName: "api-data",
        networkTimeoutSeconds: 5,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 5,
          }),
        ],
      }),
    },
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkOnly(),
    },
  ],
});

serwist.addEventListeners();
