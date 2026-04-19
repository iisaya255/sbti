import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
}

async function getResultData(slug: string, typeCode: string) {
  const supabase = await createClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, slug, title, description")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!quiz) return null;

  const { data: personalityType } = await supabase
    .from("personality_types")
    .select("code, name, description, intro, image_url")
    .eq("quiz_id", quiz.id)
    .eq("code", typeCode)
    .single();

  if (!personalityType) return null;

  return { quiz, personalityType };
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const { type } = await searchParams;
  if (!type) return {};

  const data = await getResultData(slug, type);
  if (!data) return {};

  const { quiz, personalityType } = data;
  const title = `我是「${personalityType.name}」— ${quiz.title}`;
  const description =
    personalityType.description || `来做「${quiz.title}」测试，看看你是什么类型！`;
  const image = personalityType.image_url || "/og-image.svg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/q/${slug}/result?type=${type}`,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ResultPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { type } = await searchParams;

  if (!type) notFound();

  const data = await getResultData(slug, type);
  if (!data) notFound();

  const { quiz, personalityType } = data;

  return (
    <div className="result-wrap card">
      <div className="result-type-hero">
        {personalityType.image_url && (
          <figure className="result-visual">
            <img
              src={personalityType.image_url}
              alt={personalityType.name}
            />
          </figure>
        )}

        <div className="type-box">
          <span className="result-card-tag">你的测试结果</span>
          <h2 className="type-title-main">{personalityType.name}</h2>
          <span className="match-badge">{personalityType.code}</span>
        </div>
      </div>

      <div className="result-layout" style={{ marginTop: 24 }}>
        <div className="result-card card">
          {personalityType.intro && (
            <p className="poster-caption">{personalityType.intro}</p>
          )}
          <p className="result-desc">{personalityType.description}</p>
        </div>
      </div>

      <div className="result-actions" style={{ marginTop: 24 }}>
        <Link href={`/q/${slug}`} className="button button-primary">
          我也来测
        </Link>
        <Link href="/" className="button button-secondary">
          更多测试
        </Link>
      </div>
    </div>
  );
}
