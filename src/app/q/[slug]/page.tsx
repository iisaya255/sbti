import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuizRunner from "@/components/quiz/QuizRunner";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getQuizData(slug: string) {
  const supabase = await createClient();

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select(
      `
      id,
      slug,
      title,
      description,
      og_image,
      status,
      dimensions (id, code, name, sort_order),
      questions (id, dim_code, text, sort_order, special, options (id, label, value, sort_order)),
      personality_types (id, code, name, description, intro, image_url, dim_pattern)
    `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !quiz) return null;

  // Sort nested arrays
  quiz.dimensions?.sort((a: any, b: any) => a.sort_order - b.sort_order);
  quiz.questions?.sort((a: any, b: any) => a.sort_order - b.sort_order);
  quiz.questions?.forEach((q: any) =>
    q.options?.sort((a: any, b: any) => a.sort_order - b.sort_order)
  );

  return quiz;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await getQuizData(slug);
  if (!quiz) return {};

  const title = quiz.title;
  const description = quiz.description || `来做「${quiz.title}」测试吧！`;
  const ogImage = quiz.og_image || "/og-image.svg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/q/${slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function QuizPage({ params }: Props) {
  const { slug } = await params;
  const quiz = await getQuizData(slug);

  if (!quiz) notFound();

  const dimensionOrder = quiz.dimensions.map((d: any) => d.code);

  const questions = quiz.questions.map((q: any) => ({
    id: q.id,
    dimCode: q.dim_code,
    text: q.text,
    special: q.special || false,
    options: q.options.map((o: any) => ({
      label: o.label,
      value: o.value,
    })),
  }));

  const personalityTypes = quiz.personality_types.map((t: any) => ({
    code: t.code,
    name: t.name,
    description: t.description,
    intro: t.intro || "",
    imageUrl: t.image_url || "",
    dimPattern: t.dim_pattern,
  }));

  return (
    <QuizRunner
      quizId={quiz.id}
      slug={slug}
      title={quiz.title}
      questions={questions}
      dimensionOrder={dimensionOrder}
      personalityTypes={personalityTypes}
    />
  );
}
