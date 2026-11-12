// FitBridge web adresi: kartalbric.com/fitbridge buraya yönlenir (Can onaylayınca kesinleşecek).
const FITBRIDGE_URL = "https://fitbridge.kartalbric.com";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  async redirects() {
    return [
      { source: "/fitbridge", destination: FITBRIDGE_URL, permanent: false },
      { source: "/fitbridge/:path*", destination: `${FITBRIDGE_URL}/:path*`, permanent: false },
    ];
  },
};

export default nextConfig;
