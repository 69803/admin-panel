import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ParkFinder ahora se llama Spotbase: las direcciones viejas siguen
  // funcionando (están en Google, Meta y Play Console).
  async redirects() {
    return [
      { source: "/parkfinder", destination: "/spotbase", permanent: true },
      { source: "/parkfinder/:path*", destination: "/spotbase/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
