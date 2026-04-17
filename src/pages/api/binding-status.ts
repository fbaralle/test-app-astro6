import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

interface ServiceStatus {
  status: "ok" | "error";
  latency: number;
  error?: string;
}

interface HealthcheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    d1: ServiceStatus;
    kv_sessions: ServiceStatus;
    kv_flags: ServiceStatus;
    r2: ServiceStatus;
  };
  debug?: {
    envKeys: string[];
    hasDB: boolean;
    hasSessions: boolean;
    hasFlags: boolean;
    hasMedia: boolean;
  };
}

async function checkD1(db: D1Database | null): Promise<ServiceStatus> {
  if (!db) {
    return { status: "error", latency: 0, error: "D1 binding not available" };
  }
  const start = performance.now();
  try {
    await db.prepare("SELECT 1").first();
    return { status: "ok", latency: Math.round(performance.now() - start) };
  } catch (e) {
    return {
      status: "error",
      latency: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

async function checkKV(kv: KVNamespace | null, name: string): Promise<ServiceStatus> {
  if (!kv) {
    return { status: "error", latency: 0, error: `KV binding '${name}' not available` };
  }
  const start = performance.now();
  try {
    await kv.get("__healthcheck__");
    return { status: "ok", latency: Math.round(performance.now() - start) };
  } catch (e) {
    return {
      status: "error",
      latency: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

async function checkR2(r2: R2Bucket | null): Promise<ServiceStatus> {
  if (!r2) {
    return { status: "error", latency: 0, error: "R2 binding not available" };
  }
  const start = performance.now();
  try {
    await r2.head("__healthcheck__");
    return { status: "ok", latency: Math.round(performance.now() - start) };
  } catch (e) {
    return {
      status: "error",
      latency: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export const GET: APIRoute = async () => {
  // Debug info about what's available
  const debug = {
    envKeys: Object.keys(env || {}),
    hasDB: !!env?.DB,
    hasSessions: !!env?.SESSIONS,
    hasFlags: !!env?.FLAGS,
    hasMedia: !!env?.MEDIA,
  };

  const [d1, kv_sessions, kv_flags, r2] = await Promise.all([
    checkD1(env?.DB || null),
    checkKV(env?.SESSIONS || null, "SESSIONS"),
    checkKV(env?.FLAGS || null, "FLAGS"),
    checkR2(env?.MEDIA || null),
  ]);

  const services = { d1, kv_sessions, kv_flags, r2 };
  const errorCount = Object.values(services).filter(
    (s) => s.status === "error"
  ).length;

  const status: HealthcheckResponse["status"] =
    errorCount === 0 ? "healthy" : errorCount < 3 ? "degraded" : "unhealthy";

  const response: HealthcheckResponse = {
    status,
    timestamp: new Date().toISOString(),
    services,
    debug,
  };

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
};
