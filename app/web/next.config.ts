import type { NextConfig } from "next";

/**
 * PRJ-019 Clawbridge Web - Next.js Configuration
 *
 * DEC-019-033 §⑤ priviledge escalation 4 層防御 (Static Policy / Runtime FeatureFlag /
 * HITL 10th / Audit + Anomaly Detection) のうち、本層 (Web) は L2-L3 の UI 提供層。
 * service_role key は subprocess に渡さない設計のため、本ファイルから一切参照しない。
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 13 prohibited domains (DEC-019-033 §⑤) は Casbin policy で deny envelope として処理。
  // Next 側では Content Security Policy で defence-in-depth。
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
