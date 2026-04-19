"use client";

import { useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Quiz {
  id: string;
  author_id: string;
  slug: string;
  title: string;
  description: string;
  og_image: string | null;
  status: string;
  created_at: string;
  published_at: string | null;
}

interface Props {
  quiz: Quiz;
  onUpdate: (quiz: Quiz) => void;
}

export default function BasicInfoForm({ quiz, onUpdate }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (field: string, value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from("quizzes")
          .update({ [field]: value })
          .eq("id", quiz.id)
          .select("*")
          .single();
        if (data) onUpdate(data as Quiz);
      }, 600);
    },
    [quiz.id, onUpdate]
  );

  const handleChange = (field: keyof Quiz, value: string) => {
    onUpdate({ ...quiz, [field]: value });
    save(field, value);
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      <div className="creator-form">
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            className="form-input"
            value={quiz.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="My awesome quiz"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            value={quiz.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="A brief description of your quiz..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Slug</label>
          <input
            className="form-input"
            value={quiz.slug}
            onChange={(e) => handleChange("slug", e.target.value)}
            placeholder="my-quiz"
          />
          <span className="form-hint">
            URL will be: /q/{quiz.slug}
          </span>
        </div>
      </div>
    </div>
  );
}
