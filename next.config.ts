import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/image refuses any remote host that is not listed here.
    remotePatterns: [
      // Google serves profile pictures from lh3 through lh6. They are listed
      // one by one on purpose: a "**.googleusercontent.com" wildcard is
      // accepted by the image optimizer endpoint but still rejected by the
      // <Image> component itself, which breaks the page at render time.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "lh4.googleusercontent.com" },
      { protocol: "https", hostname: "lh5.googleusercontent.com" },
      { protocol: "https", hostname: "lh6.googleusercontent.com" },
      // Environment Canada's weather icons, used on the weather page.
      { protocol: "https", hostname: "weather.gc.ca" },
    ],
  },
};

export default nextConfig;
