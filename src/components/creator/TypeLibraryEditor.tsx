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
  quizId: string;
  dimensions: Dimension[];
  types: PersonalityTypeRow[];
  onUpdate: (types: PersonalityTypeRow[]) => void;
}

export default function TypeLibraryEditor({ quizId, dimensions, types, onUpdate }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = createClient();

  const addType = async () => {
    const pattern: Record<string, "L" | "M" | "H"> = {};
    dimensions.forEach((d) => {
      pattern[d.code] = "M";
    });
    const { data } = await supabase
      .from("personality_types")
      .insert({
        quiz_id: quizId,
        code: `T${types.length + 1}`,
        name: "New Type",
        description: "",
        dim_pattern: pattern,
      })
      .select("*")
      .single();
    if (data) {
      const newType = data as PersonalityTypeRow;
      onUpdate([...types, newType]);
      setExpandedId(newType.id);
    }
  };

  const updateType = async (id: string, field: string, value: unknown) => {
    const { data } = await supabase
      .from("personality_types")
      .update({ [field]: value })
      .eq("id", id)
      .select("*")
      .single();
    if (data) onUpdate(types.map((t) => (t.id === id ? (data as PersonalityTypeRow) : t)));
  };

  const deleteType = async (id: string) => {
    await supabase.from("personality_types").delete().eq("id", id);
    onUpdate(types.filter((t) => t.id !== id));
  };

  const updatePattern = (type: PersonalityTypeRow, dimCode: string, level: "L" | "M" | "H") => {
    const newPattern = { ...type.dim_pattern, [dimCode]: level };
    updateType(type.id, "dim_pattern", newPattern);
    onUpdate(types.map((t) => (t.id === type.id ? { ...t, dim_pattern: newPattern } : t)));
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      <div className="creator-form">
        <h3 style={{ margin: 0 }}>Personality Types</h3>
        <p className="form-hint">
          Define personality types and set L/M/H patterns for each dimension.
        </p>

        <div style={{ display: "grid", gap: 16 }}>
          {types.map((type) => (
            <div key={type.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <strong>{type.code}</strong>
                <span style={{ flex: 1 }}>{type.name}</span>
                <button
                  className="button button-secondary"
                  style={{ minHeight: 36, padding: "0 12px", fontSize: 13 }}
                  onClick={() => setExpandedId(expandedId === type.id ? null : type.id)}
                >
                  {expandedId === type.id ? "Collapse" : "Edit"}
                </button>
                <button className="delete-button" onClick={() => deleteType(type.id)}>
                  Delete
                </button>
              </div>

              {expandedId === type.id && (
                <div style={{ marginTop: 16 }} className="creator-form">
                  <div className="form-group">
                    <label className="form-label">Code</label>
                    <input
                      className="form-input"
                      value={type.code}
                      onChange={(e) => updateType(type.id, "code", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      className="form-input"
                      value={type.name}
                      onChange={(e) => updateType(type.id, "name", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      value={type.description}
                      onChange={(e) => updateType(type.id, "description", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dimension Pattern</label>
                    <div style={{ display: "grid", gap: 8 }}>
                      {dimensions.map((dim) => (
                        <div key={dim.id} className="sortable-item">
                          <span style={{ minWidth: 120 }}>
                            <strong>{dim.code}</strong> {dim.name}
                          </span>
                          <div style={{ display: "flex", gap: 4 }}>
                            {(["L", "M", "H"] as const).map((level) => (
                              <button
                                key={level}
                                className={`button ${
                                  type.dim_pattern[dim.code] === level
                                    ? "button-primary"
                                    : "button-secondary"
                                }`}
                                style={{ minHeight: 32, padding: "0 14px", fontSize: 13 }}
                                onClick={() => updatePattern(type, dim.code, level)}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="add-button" onClick={addType}>
          + Add Personality Type
        </button>
      </div>
    </div>
  );
}
