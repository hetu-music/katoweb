declare module "next-pwa" {
    import { NextConfig } from "next";

    interface RuntimeCacheOptions {
        cacheName?: string;
        expiration?: {
            maxEntries?: number;
            maxAgeSeconds?: number;
        };
        networkTimeoutSeconds?: number;
        cacheableResponse?: {
            statuses?: number[];
        };
    }

    interface RuntimeCacheRule {
        urlPattern: RegExp | string;
        handler: "CacheFirst" | "NetworkFirst" | "NetworkOnly" | "StaleWhileRevalidate" | "CacheOnly";
        method?: string;
        options?: RuntimeCacheOptions;
    }

    interface PWAConfig {
        dest?: string;
        register?: boolean;
        skipWaiting?: boolean;
        disable?: boolean;
        scope?: string;
        sw?: string;
        runtimeCaching?: RuntimeCacheRule[];
        publicExcludes?: string[];
        buildExcludes?: (string | RegExp)[];
        fallbacks?: {
            document?: string;
            image?: string;
            font?: string;
            audio?: string;
            video?: string;
        };
        cacheOnFrontEndNav?: boolean;
        reloadOnOnline?: boolean;
        customWorkerDir?: string;
    }

    function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;

    export default withPWA;
}
