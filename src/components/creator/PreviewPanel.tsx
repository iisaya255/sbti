"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  computeQuizResult,
  type QuizQuestion,
  type PersonalityType,
  type QuizResult,
} from "@/lib/quiz-engine";

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

interface Dimension {
  id: string;
  quiz_id: string;
  code: string;
  name: string;
  sort_order: number;
}

interface QuestionRow {
  id: string;
  quiz_id: string;
  dimension_id: string;
  text: string;
  sort_order: number;
}

interface OptionRow {
  id: string;
  question_id: string;
  text: string;
  score: number;
  sort_order: number;
}

interface PersonalityTypeRow {
  id: string;
  quiz_id: string;
  code: string;
  name: string;
  description: string;
  image_url: string | null;
  dim_pattern: Record<string, "L" | "M" | "H">;
}

interface Props {
  quiz: Quiz;
  dimensions: Dimension[];
  questions: QuestionRow[];
  options: OptionRow[];
  types: PersonalityTypeRow[];
}

export default function PreviewPanel({ quiz, dimensions, questions, options, types }: Props) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [publishing, setPublishing] = useState(false);

  const dimMap = Object.fromEntries(dimensions.map((d) => [d.id, d]));
  const dimensionOrder = dimensions.map((d) => d.code);

  const engineQuestions: QuizQuestion[] = questions.map((q) => ({
    id: q.id,
    dimCode: dimMap[q.dimension_id]?.code ?? "",
    text: q.text,
    options: options
      .filter((o) => o.question_id === q.id)
      .map((o) => ({ label: o.text, value: o.score })),
  }));

  const engineTypes: PersonalityType[] = types.map((t) => ({
    code: t.code,
    name: t.name,
    description: t.description,
    intro: "",
    imageUrl: t.image_url ?? "",
    dimPattern: t.dim_pattern,
  }));

  const handleAnswer = (questionId: string, score: number) => {
    const next = { ...answers, [questionId]: score };
    setAnswers(next);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const r = computeQuizResult(engineQuestions, next, dimensionOrder, engineTypes);
      setResult(r);
    }
  };

  const resetPreview = () => {
    setCurrentQ(0);
    setAnswers({});
    setResult(null);
  };

  const publish = async () => {
    setPublishing(true);
    const supabase = createClient();
    await supabase
      .from("quizzes")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", quiz.id);
    setPublishing(false);
    alert("Quiz published!");
  };

  if (questions.length === 0) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <p>No questions yet. Go back and add some questions first.</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ margin: "0 0 16px" }}>Result Preview</h3>
        <div className="match-badge" style={{ marginBottom: 12 }}>
          {result.bestMatch.code} - {result.bestMatch.name} ({result.bestMatch.similarity}% match)
        </div>
        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
          {result.bestMatch.description}
        </p>
        <p style={{ marginTop: 12, fontSize: 14, color: "var(--muted)" }}>
          Signature: {result.signature}
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button className="button button-secondary" onClick={resetPreview}>
            Restart Preview
          </button>
          <button
            className="button button-primary"
            onClick={publish}
            disabled={publishing}
          >
            {publishing ? "Publishing..." : "Publish Quiz"}
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  const qOptions = options.filter((o) => o.question_id === q.id);

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Preview: {quiz.title || "Untitled Quiz"}</h3>
        <span className="form-hint">
          {currentQ + 1} / {questions.length}
        </span>
      </div>

      <div className="progress-track" style={{ marginBottom: 20 }}>
        <div
          className="progress-bar"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="question-card">
        <div className="question-meta">
          <span className="question-index">Q{currentQ + 1}</span>
          <span>{dimMap[q.dimension_id]?.name}</span>
        </div>
        <h4 className="question-title">{q.text || "Untitled question"}</h4>
        <div className="option-grid">
          {qOptions.map((opt, i) => (
            <label key={opt.id} className="option">
              <input
                type="radio"
                name={`preview-${q.id}`}
                onChange={() => handleAnswer(q.id, opt.score)}
                checked={answers[q.id] === opt.score}
              />
              <div className="option-body">
                <span className="option-code">{String.fromCharCode(65 + i)}</span>
                <span>{opt.text || "..."}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button className="button button-secondary" onClick={resetPreview}>
          Restart
        </button>
      </div>
    </div>
  );
}
