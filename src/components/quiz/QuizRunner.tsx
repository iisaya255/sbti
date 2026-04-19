"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  computeQuizResult,
  QuizQuestion,
  PersonalityType,
} from "@/lib/quiz-engine";
import { createBrowserClient } from "@supabase/ssr";

interface QuizRunnerProps {
  quizId: string;
  slug: string;
  title: string;
  questions: QuizQuestion[];
  dimensionOrder: string[];
  personalityTypes: PersonalityType[];
}

function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function QuizRunner({
  quizId,
  slug,
  title,
  questions,
  dimensionOrder,
  personalityTypes,
}: QuizRunnerProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const answered = Object.keys(answers).length;
  const total = questions.length;
  const progress = total > 0 ? Math.round((answered / total) * 100) : 0;
  const allAnswered = answered === total;

  const handleSelect = useCallback(
    (questionId: string, value: number) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      // Auto-advance to next question
      if (currentIndex < total - 1) {
        setTimeout(() => setCurrentIndex((i) => i + 1), 300);
      }
    },
    [currentIndex, total]
  );

  const handleSubmit = async () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true);

    try {
      const result = computeQuizResult(
        questions,
        answers,
        dimensionOrder,
        personalityTypes
      );

      // Submit to Supabase
      const supabase = getSupabaseBrowser();
      await supabase.from("submissions").insert({
        quiz_id: quizId,
        answers,
        raw_scores: result.rawScores,
        levels: result.levels,
        result_code: result.bestMatch.code,
        signature: result.signature,
      });

      router.push(`/q/${slug}/result?type=${result.bestMatch.code}`);
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitting(false);
    }
  };

  const current = questions[currentIndex];

  return (
    <div className="test-wrap card">
      {/* Header */}
      <div className="topbar">
        <h2 style={{ margin: 0, fontSize: "clamp(18px, 2.5vw, 24px)" }}>
          {title}
        </h2>
        <span className="progress-text">
          {answered} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-track">
        <div
          className="progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question navigation dots */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
          margin: "16px 0",
        }}
      >
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(i)}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "1px solid rgba(19,78,68,0.15)",
              background:
                i === currentIndex
                  ? "var(--brand)"
                  : answers[q.id] !== undefined
                  ? "rgba(19,78,68,0.15)"
                  : "rgba(255,255,255,0.8)",
              color: i === currentIndex ? "#fff" : "var(--text)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Current question */}
      {current && (
        <div className="question-card">
          <div className="question-meta">
            <span className="question-index">
              第 {currentIndex + 1} / {total} 题
            </span>
          </div>
          <h3 className="question-title">{current.text}</h3>
          <div className="option-grid">
            {current.options.map((opt, oi) => {
              const selected = answers[current.id] === opt.value;
              return (
                <label className="option" key={oi}>
                  <input
                    type="radio"
                    name={`q-${current.id}`}
                    checked={selected}
                    onChange={() => handleSelect(current.id, opt.value)}
                  />
                  <div className="option-body">
                    <span className="option-code">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span>{opt.label}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation + Submit */}
      <div className="actions-bottom">
        <button
          className="button button-secondary"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          上一题
        </button>

        {currentIndex < total - 1 ? (
          <button
            className="button button-primary"
            onClick={() => setCurrentIndex((i) => i + 1)}
          >
            下一题
          </button>
        ) : (
          <button
            className="button button-primary"
            disabled={!allAnswered || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "提交中..." : "查看结果"}
          </button>
        )}
      </div>
    </div>
  );
}
