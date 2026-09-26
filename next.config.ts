import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // npm run build:html のときだけ静的書き出し（out/）にする
  ...(process.env.STATIC_HTML === "1" ? { output: "export" as const } : {}),
  reactStrictMode: true,
};

export default nextConfig;
