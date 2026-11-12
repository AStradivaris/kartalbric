/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  // /fitbridge yönlendirmesi middleware.ts içinde: Android -> Google Play, diğerleri -> web uygulaması.
};

export default nextConfig;
