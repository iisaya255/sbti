"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BasicInfoForm from "@/components/creator/BasicInfoForm";
import DimensionEditor from "@/components/creator/DimensionEditor";
import QuestionEditor from "@/components/creator/QuestionEditor";
import TypeLibraryEditor from "@/components/creator/TypeLibraryEditor";
import PreviewPanel from "@/components/creator/PreviewPanel";

const STEPS = [
  { num: 1, label: "Basic Info" },
  { num: 2, label: "Dimensions" },
  { num: 3, label: "Questions" },
  { num: 4, label: "Type Library" },
  { num: 5, label: "Preview" },
];

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

interface Question {
  id: string;
  quiz_id: string;
  dimension_id: string;
  text: string;
  sort_order: number;
}

interface Option {
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

export default function QuizEditorPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [step, setStep] = useState(1);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [types, setTypes] = useState<PersonalityTypeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const [quizRes, dimRes, qRes, optRes, typeRes] = await Promise.all([
      supabase.from("quizzes").select("*").eq("id", quizId).single(),
      supabase.from("dimensions").select("*").eq("quiz_id", quizId).order("sort_order"),
      supabase.from("questions").select("*").eq("quiz_id", quizId).order("sort_order"),
      supabase.from("options").select("*, questions!inner(quiz_id)").eq("questions.quiz_id", quizId).order("sort_order"),
      supabase.from("personality_types").select("*").eq("quiz_id", quizId),
    ]);

    if (!quizRes.data) {
      router.push("/");
      return;
    }

    setQuiz(quizRes.data as Quiz);
    setDimensions((dimRes.data ?? []) as Dimension[]);
    setQuestions((qRes.data ?? []) as Question[]);
    setOptions((optRes.data ?? []) as Option[]);
    setTypes((typeRes.data ?? []) as PersonalityTypeRow[]);
    setLoading(false);
  }, [quizId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !quiz) {
    return (
      <div className="creator-shell">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="creator-shell">
      <nav className="creator-steps">
        {STEPS.map((s) => (
          <button
            key={s.num}
            className={`creator-step${s.num === step ? " active" : ""}${s.num < step ? " completed" : ""}`}
            onClick={() => setStep(s.num)}
          >
            <span>{s.num}</span> {s.label}
          </button>
        ))}
      </nav>

      {step === 1 && <BasicInfoForm quiz={quiz} onUpdate={(q) => setQuiz(q)} />}
      {step === 2 && (
        <DimensionEditor
          quizId={quizId}
          dimensions={dimensions}
          onUpdate={setDimensions}
        />
      )}
      {step === 3 && (
        <QuestionEditor
          quizId={quizId}
          dimensions={dimensions}
          questions={questions}
          options={options}
          onUpdateQuestions={setQuestions}
          onUpdateOptions={setOptions}
        />
      )}
      {step === 4 && (
        <TypeLibraryEditor
          quizId={quizId}
          dimensions={dimensions}
          types={types}
          onUpdate={setTypes}
        />
      )}
      {step === 5 && (
        <PreviewPanel
          quiz={quiz}
          dimensions={dimensions}
          questions={questions}
          options={options}
          types={types}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        {step > 1 && (
          <button className="button button-secondary" onClick={() => setStep(step - 1)}>
            Previous
          </button>
        )}
        {step < 5 && (
          <button
            className="button button-primary"
            style={{ marginLeft: "auto" }}
            onClick={() => setStep(step + 1)}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
