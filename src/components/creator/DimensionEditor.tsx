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

interface Props {
  quizId: string;
  dimensions: Dimension[];
  onUpdate: (dims: Dimension[]) => void;
}

export default function DimensionEditor({ quizId, dimensions, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");

  const supabase = createClient();

  const addDimension = async () => {
    const sort_order = dimensions.length;
    const { data } = await supabase
      .from("dimensions")
      .insert({ quiz_id: quizId, code: `D${sort_order + 1}`, name: "New Dimension", sort_order })
      .select("*")
      .single();
    if (data) onUpdate([...dimensions, data as Dimension]);
  };

  const startEdit = (dim: Dimension) => {
    setEditingId(dim.id);
    setEditCode(dim.code);
    setEditName(dim.name);
  };

  const saveEdit = async (id: string) => {
    const { data } = await supabase
      .from("dimensions")
      .update({ code: editCode, name: editName })
      .eq("id", id)
      .select("*")
      .single();
    if (data) {
      onUpdate(dimensions.map((d) => (d.id === id ? (data as Dimension) : d)));
    }
    setEditingId(null);
  };

  const deleteDimension = async (id: string) => {
    await supabase.from("dimensions").delete().eq("id", id);
    onUpdate(dimensions.filter((d) => d.id !== id));
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      <div className="creator-form">
        <h3 style={{ margin: 0 }}>Dimensions</h3>
        <p className="form-hint">
          Define the personality dimensions your quiz will measure.
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          {dimensions.map((dim) => (
            <div key={dim.id} className="sortable-item">
              {editingId === dim.id ? (
                <div className="sortable-content" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className="form-input"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    placeholder="Code"
                    style={{ width: 100 }}
                  />
                  <input
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Name"
                    style={{ flex: 1 }}
                  />
                  <button className="button button-primary" onClick={() => saveEdit(dim.id)}>
                    Save
                  </button>
                  <button className="button button-secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="sortable-content" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <strong>{dim.code}</strong>
                    <span>{dim.name}</span>
                  </div>
                  <button className="button button-secondary" onClick={() => startEdit(dim)} style={{ minHeight: 36, padding: "0 12px", fontSize: 13 }}>
                    Edit
                  </button>
                  <button className="delete-button" onClick={() => deleteDimension(dim.id)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <button className="add-button" onClick={addDimension}>
          + Add Dimension
        </button>
      </div>
    </div>
  );
}
