import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DeleteQuizButton from "@/components/quiz/DeleteQuizButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "我的问卷",
};

export default async function MyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch user's quizzes
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, slug, title, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch submission counts
  const quizIds = (quizzes || []).map((q) => q.id);
  let submissionCounts: Record<string, number> = {};

  if (quizIds.length > 0) {
    const { data: counts } = await supabase
      .from("submissions")
      .select("quiz_id")
      .in("quiz_id", quizIds);

    if (counts) {
      for (const row of counts) {
        submissionCounts[row.quiz_id] =
          (submissionCounts[row.quiz_id] || 0) + 1;
      }
    }
  }

  return (
    <div style={{ paddingTop: 24 }}>
      <div className="section-heading">
        <span className="eyebrow">Dashboard</span>
        <h2>我的问卷</h2>
        <p>管理你创建的所有问卷。</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Link href="/create" className="button button-primary">
          + 创建新问卷
        </Link>
      </div>

      {!quizzes || quizzes.length === 0 ? (
        <div
          className="card"
          style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}
        >
          <p>还没有创建任何问卷，快去创建一个吧！</p>
        </div>
      ) : (
        <div className="question-list">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="question-card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>{quiz.title || "未命名问卷"}</h3>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      background:
                        quiz.status === "published"
                          ? "rgba(19,78,68,0.12)"
                          : "rgba(221,112,66,0.15)",
                      color:
                        quiz.status === "published"
                          ? "var(--brand)"
                          : "var(--accent)",
                    }}
                  >
                    {quiz.status === "published" ? "已发布" : "草稿"}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>
                    {submissionCounts[quiz.id] || 0} 次提交
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Link
                  href={`/create/${quiz.id}`}
                  className="button button-secondary"
                  style={{ minHeight: 36, fontSize: 14 }}
                >
                  编辑
                </Link>
                {quiz.slug && quiz.status === "published" && (
                  <Link
                    href={`/q/${quiz.slug}`}
                    className="button button-tertiary"
                    style={{ minHeight: 36, fontSize: 14 }}
                  >
                    查看
                  </Link>
                )}
                <DeleteQuizButton quizId={quiz.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
