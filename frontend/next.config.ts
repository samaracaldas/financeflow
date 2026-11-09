import type { NextConfig } from "next";

/**
 * O navegador fala só com o próprio domínio do front (/api/...), e o Next.js
 * repassa para a API Express. Assim o cookie httpOnly de sessão é first-party:
 * Safari, Firefox, Brave e aba anônima do Chrome bloqueiam cookies de
 * terceiros, o que quebrava o login com Vercel (vercel.app) + Render (onrender.com).
 */
const API_URL = (
  process.env.API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://financeflow-api-n4vi.onrender.com"
    : "http://localhost:5000")
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
