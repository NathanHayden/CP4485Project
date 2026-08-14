import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/image refuses any remote host that is not listed here.
    remotePatterns: [
      // Google profile pictures. The subdomain varies (lh3, lh4, lh5…), so
      // match any of them rather than pinning one.
      { protocol: "https", hostname: "**.googleusercontent.com" },
      // Environment Canada's weather icons, used on the weather page.
      { protocol: "https", hostname: "weather.gc.ca" },
    ],
  },
};

export default nextConfig;
