"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function DeleteQuizButton({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("确定要删除这个问卷吗？此操作无法撤销。")) return;
    setDeleting(true);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await supabase.from("quizzes").delete().eq("id", quizId);
      router.refresh();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <button
      className="button button-tertiary"
      style={{
        minHeight: 36,
        fontSize: 14,
        color: "#c0392b",
        borderColor: "rgba(192,57,43,0.2)",
      }}
      disabled={deleting}
      onClick={handleDelete}
    >
      {deleting ? "删除中..." : "删除"}
    </button>
  );
}
