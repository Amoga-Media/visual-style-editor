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
    <div className="pb-3.5 space-y-2 border-b border-slate-200 dark:border-[#262626]">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5 text-[#0099ff]" />
          <span>Content Copy</span>
        </div>
        {!isEditing ? (
          <button
            type="button"
            aria-label="Edit text content"
            onClick={() => setIsEditing(true)}
            className="text-[11px] text-[#0099ff] hover:text-[#33adff] font-medium cursor-pointer"
          >
            Edit Text
          </button>
        ) : (
          <button
            type="button"
            aria-label="Apply text content edits"
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
          aria-label="Edit text input"
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
          className="w-full bg-[#141414] border border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] rounded-lg p-2 text-xs text-zinc-200 focus:outline-none"
          autoFocus
        />
      ) : (
        <div
          onDoubleClick={() => setIsEditing(true)}
          className="text-xs text-zinc-300 bg-[#141414] border border-[#262626] rounded-lg p-2.5 truncate max-h-20 overflow-hidden cursor-pointer hover:border-zinc-700 transition-colors"
          title="Double click to edit"
        >
          {text || <span className="italic text-zinc-500">Empty text</span>}
        </div>
      )}
    </div>
  );
}
