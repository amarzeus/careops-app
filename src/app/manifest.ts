import { MetadataRoute } from "next";

/**
 * Web App Manifest served at /manifest.json via Next.js App Router.
 * Enables PWA installability and improves mobile SEO signals.
 */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "CareOps – Unified Service Operations Platform",
        short_name: "CareOps",
        description:
            "One platform to manage your entire service business — bookings, leads, forms, inventory, AI voice receptionist, and more.",
        start_url: "/",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#2563eb",
        icons: [
            {
                src: "/favicon.ico",
                sizes: "any",
                type: "image/x-icon",
            },
        ],
        categories: ["business", "productivity", "utilities"],
        lang: "en",
    };
}
