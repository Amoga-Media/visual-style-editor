import React, { useState, useEffect } from "react";
import type { EditRecord } from "@/types";
import { Edit3, Check } from "lucide-react";

interface InlineTextEditorProps {
  element: Element | null;
  structuralPath: string | null;
  onEdit?: (record: EditRecord) => void;
}

export default function InlineTextEditor({
  element,
  structuralPath,
  onEdit,
}: InlineTextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState("");
  const [baselineText, setBaselineText] = useState("");

  useEffect(() => {
    if (!element) {
      setIsEditing(false);
      return;
    }
    const currentText = element.textContent || "";
    setText(currentText);
    setBaselineText(currentText);
    setIsEditing(false);
  }, [element]);

  if (!element || !structuralPath) return null;

  // Only show text editor for leaf elements that contain text (avoid wiping child elements of containers)
  const isLeafOrText = element.children.length === 0;
  if (!isLeafOrText) return null;

  function handleCommit() {
    if (text === baselineText) {
      setIsEditing(false);
      return;
    }

    if (element) {
      element.textContent = text;
    }

    onEdit?.({
      kind: "text",
      structuralPath: structuralPath!,
      property: "text-content",
      oldText: baselineText,
      newText: text,
      timestamp: new Date().toISOString(),
    });

    setBaselineText(text);
    setIsEditing(false);
  }

  return (
    <div className="p-4 border-b border-gray-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Content Copy</span>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
          >
            Edit Text
          </button>
        ) : (
          <button
            onClick={handleCommit}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <Check className="w-3 h-3" />
            Apply
          </button>
        )}
      </div>

      {isEditing ? (
        <textarea
          rows={3}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (element) element.textContent = e.target.value;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleCommit();
            }
          }}
          className="w-full bg-gray-950 border border-indigo-500 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          autoFocus
        />
      ) : (
        <div
          onDoubleClick={() => setIsEditing(true)}
          className="text-xs text-gray-300 bg-gray-900/80 border border-gray-800/80 rounded-lg p-2.5 truncate max-h-20 overflow-hidden cursor-pointer hover:border-gray-700 transition-colors"
          title="Double click to edit"
        >
          {text || <span className="italic text-gray-500">Empty text</span>}
        </div>
      )}
    </div>
  );
}
