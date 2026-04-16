/// <reference types="astro/client" />
/// <reference path="../worker-configuration.d.ts" />

declare module "cloudflare:workers" {
  export const env: Env;
}
