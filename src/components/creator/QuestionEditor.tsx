"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

interface Props {
  quizId: string;
  dimensions: Dimension[];
  questions: Question[];
  options: Option[];
  onUpdateQuestions: (q: Question[]) => void;
  onUpdateOptions: (o: Option[]) => void;
}

function OptionEditor({
  questionId,
  options,
  onUpdate,
}: {
  questionId: string;
  options: Option[];
  onUpdate: (opts: Option[]) => void;
}) {
  const supabase = createClient();
  const qOpts = options.filter((o) => o.question_id === questionId);

  const addOption = async () => {
    if (qOpts.length >= 5) return;
    const sort_order = qOpts.length;
    const { data } = await supabase
      .from("options")
      .insert({ question_id: questionId, text: "", score: 0, sort_order })
      .select("*")
      .single();
    if (data) onUpdate([...options, data as Option]);
  };

  const updateOption = async (id: string, field: string, value: string | number) => {
    const { data } = await supabase
      .from("options")
      .update({ [field]: value })
      .eq("id", id)
      .select("*")
      .single();
    if (data) onUpdate(options.map((o) => (o.id === id ? (data as Option) : o)));
  };

  const deleteOption = async (id: string) => {
    await supabase.from("options").delete().eq("id", id);
    onUpdate(options.filter((o) => o.id !== id));
  };

  return (
    <div style={{ marginTop: 12, paddingLeft: 16 }}>
      <label className="form-label" style={{ marginBottom: 8 }}>
        Options ({qOpts.length}/5)
      </label>
      {qOpts.map((opt, i) => (
        <div key={opt.id} className="sortable-item" style={{ marginBottom: 8 }}>
          <span style={{ fontWeight: 700, color: "var(--brand)", minWidth: 24 }}>{String.fromCharCode(65 + i)}</span>
          <input
            className="form-input"
            style={{ flex: 1 }}
            value={opt.text}
            onChange={(e) => updateOption(opt.id, "text", e.target.value)}
            placeholder="Option text"
          />
          <input
            className="form-input"
            style={{ width: 70 }}
            type="number"
            value={opt.score}
            onChange={(e) => updateOption(opt.id, "score", Number(e.target.value))}
            placeholder="Score"
          />
          <button className="delete-button" onClick={() => deleteOption(opt.id)}>
            Delete
          </button>
        </div>
      ))}
      {qOpts.length < 5 && (
        <button className="add-button" onClick={addOption} style={{ fontSize: 13, padding: 10 }}>
          + Add Option
        </button>
      )}
    </div>
  );
}

export default function QuestionEditor({
  quizId,
  dimensions,
  questions,
  options,
  onUpdateQuestions,
  onUpdateOptions,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = createClient();

  const addQuestion = async () => {
    const sort_order = questions.length;
    const dimension_id = dimensions[0]?.id ?? "";
    const { data } = await supabase
      .from("questions")
      .insert({ quiz_id: quizId, dimension_id, text: "", sort_order })
      .select("*")
      .single();
    if (data) {
      onUpdateQuestions([...questions, data as Question]);
      setExpandedId((data as Question).id);
    }
  };

  const updateQuestion = async (id: string, field: string, value: string) => {
    const { data } = await supabase
      .from("questions")
      .update({ [field]: value })
      .eq("id", id)
      .select("*")
      .single();
    if (data) onUpdateQuestions(questions.map((q) => (q.id === id ? (data as Question) : q)));
  };

  const deleteQuestion = async (id: string) => {
    await supabase.from("questions").delete().eq("id", id);
    onUpdateQuestions(questions.filter((q) => q.id !== id));
    onUpdateOptions(options.filter((o) => o.question_id !== id));
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      <div className="creator-form">
        <h3 style={{ margin: 0 }}>Questions</h3>
        <p className="form-hint">
          Add questions and link each to a dimension. Each question needs 2-5 options with score values.
        </p>

        <div style={{ display: "grid", gap: 16 }}>
          {questions.map((q, i) => {
            const dim = dimensions.find((d) => d.id === q.dimension_id);
            return (
              <div key={q.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="question-index">Q{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <input
                      className="form-input"
                      style={{ width: "100%" }}
                      value={q.text}
                      onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
                      placeholder="Question text"
                    />
                  </div>
                  <button
                    className="button button-secondary"
                    style={{ minHeight: 36, padding: "0 12px", fontSize: 13 }}
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  >
                    {expandedId === q.id ? "Collapse" : "Edit"}
                  </button>
                  <button className="delete-button" onClick={() => deleteQuestion(q.id)}>
                    Delete
                  </button>
                </div>

                {expandedId === q.id && (
                  <div style={{ marginTop: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Dimension</label>
                      <select
                        className="form-select"
                        value={q.dimension_id}
                        onChange={(e) => updateQuestion(q.id, "dimension_id", e.target.value)}
                      >
                        {dimensions.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.code} - {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <OptionEditor
                      questionId={q.id}
                      options={options}
                      onUpdate={onUpdateOptions}
                    />
                  </div>
                )}

                {expandedId !== q.id && dim && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
                    Dimension: {dim.code} - {dim.name} | Options: {options.filter((o) => o.question_id === q.id).length}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button className="add-button" onClick={addQuestion}>
          + Add Question
        </button>
      </div>
    </div>
  );
}
