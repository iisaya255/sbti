import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://sbti.how";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/types`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  // Dynamic quiz routes
  const supabase = await createClient();
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("slug, updated_at")
    .eq("status", "published");

  const quizRoutes: MetadataRoute.Sitemap = (quizzes || []).map((quiz) => ({
    url: `${baseUrl}/q/${quiz.slug}`,
    lastModified: quiz.updated_at ? new Date(quiz.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...quizRoutes];
}
