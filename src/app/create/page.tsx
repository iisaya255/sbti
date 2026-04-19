import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CreatePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .insert({
      author_id: user.id,
      title: "",
      description: "",
      slug: `quiz-${Date.now()}`,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !quiz) {
    throw new Error("Failed to create quiz draft");
  }

  redirect(`/create/${quiz.id}`);
}
