import { MetadataRoute } from "next";

/**
 * robots.txt served at /robots.txt via Next.js App Router.
 */
export default function robots(): MetadataRoute.Robots {
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://careops-app.onrender.com";
    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/faq", "/privacy", "/terms", "/cookies", "/contact"],
                disallow: ["/api/", "/(dashboard)/", "/(auth)/", "/onboarding/"],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
        host: BASE_URL,
    };
}
