import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://careops-app.onrender.com";

/**
 * Dynamic XML sitemap for CareOps — submitted to Google Search Console.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date("2026-02-19"),
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date("2026-02-19"),
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date("2026-02-19"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cookies`,
      lastModified: new Date("2026-02-19"),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date("2026-02-19"),
      changeFrequency: "yearly",
      priority: 0.7,
    },
  ];
}
