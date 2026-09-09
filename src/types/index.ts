export type TailwindMode = "none" | "v3-cdn" | "v4-cdn" | "tailwind" | "v3";

export interface ThemeColorToken {
  /** e.g. "red-500", or a bare custom token name like "clifford" */
  name: string;
  /** normalized to a hex or css color function string, e.g. "#ef4444" */
  value: string;
}

export interface ThemeFontToken {
  /** e.g. "sans", or a custom token like "display" */
  name: string;
  stack: string;
}

export interface ThemeMap {
  mode: TailwindMode;
  colors: ThemeColorToken[];
  fonts: ThemeFontToken[];
}

export type EditableProperty =
  | "width" | "height" | "min-width" | "max-width" | "min-height" | "max-height"
  | "position" | "top" | "right" | "bottom" | "left" | "z-index" | "overflow" | "cursor"
  | "padding" | "padding-top" | "padding-right" | "padding-bottom" | "padding-left"
  | "margin" | "margin-top" | "margin-right" | "margin-bottom" | "margin-left"
  | "font-size" | "font-weight" | "font-family" | "line-height" | "letter-spacing" | "text-align"
  | "font-style" | "text-transform" | "text-decoration"
  | "border-width" | "border-style" | "border-radius" | "border-color"
  | "fill" | "stroke" | "stroke-width"
  | "aspect-ratio" | "object-fit" | "object-position"
  | "text-color" | "background-color" | "opacity" | "backdrop-blur" | "rotate" | "scale" | "gap"
  | "display" | "flex-direction" | "flex-wrap" | "justify-content" | "align-items" | "align-content" | "align-self"
  | "row-gap" | "column-gap" | "flex-grow" | "flex-shrink" | "flex-basis" | "order"
  | "grid-template-columns" | "grid-template-rows" | "grid-auto-flow" | "place-items" | "place-content" | "place-self"
  | "text-content" | "box-shadow" | "white-space" | (string & {});

export interface LocationEntry {
  structuralPath: string;
  tag: string;
  /** undefined if the element has no class attribute yet */
  classAttrRange?: { startOffset: number; endOffset: number };
  styleAttrRange?: { startOffset: number; endOffset: number };
  currentClassList: string[];
}

export interface AnalyzeRequest {
  html: string; // raw file text, as read client-side from the dropped file
}

export interface AnalyzeResponse {
  locations: LocationEntry[];
  tailwindMode: TailwindMode;
  theme: ThemeMap;
}

export interface ClassEditRecord {
  id?: string;
  kind: "class";
  structuralPath: string;
  property: EditableProperty;
  oldClassList: string[];
  newClassList: string[];
  viewport?: "desktop" | "tablet" | "mobile" | "all";
  timestamp: string; // ISO 8601
}

export interface StyleEditRecord {
  id?: string;
  kind: "style";
  structuralPath: string;
  property?: EditableProperty;
  styleProperty: string;
  oldStyleValue: string;
  newStyleValue: string;
  viewport?: "desktop" | "tablet" | "mobile" | "all";
  timestamp: string; // ISO 8601
}

export interface TextEditRecord {
  kind: "text";
  structuralPath: string;
  property: "text-content";
  oldText: string;
  newText: string;
  timestamp: string; // ISO 8601
}

export interface AttributeEditRecord {
  id?: string;
  kind: "attribute";
  structuralPath: string;
  property: string; // e.g. "src", "alt", "href", "target"
  attributeName: string;
  oldValue?: string;
  newValue: string;
  timestamp?: string; // ISO 8601
}

export interface DeleteEditRecord {
  kind: "delete";
  structuralPath: string;
  property?: string;
  serializedHtml?: string;
  parentPath?: string;
  siblingIndex?: number;
  timestamp: string; // ISO 8601
}

export interface DuplicateEditRecord {
  kind: "duplicate";
  structuralPath: string;
  duplicateId?: string;
  duplicatePath?: string;
  parentPath?: string;
  siblingIndex?: number;
  property?: string;
  timestamp: string; // ISO 8601
}

export interface InsertEditRecord {
  kind: "insert";
  structuralPath: string;
  position: "inside" | "after" | "before";
  snippet: string;
  insertedPath?: string;
  parentPath?: string;
  siblingIndex?: number;
  property?: string;
  timestamp: string; // ISO 8601
}

export interface MoveEditRecord {
  kind: "move";
  structuralPath: string;
  targetPath: string;
  position: "before" | "after" | "inside";
  oldParentPath?: string;
  oldSiblingIndex?: number;
  newParentPath?: string;
  newSiblingIndex?: number;
  newPath?: string;
  moveToken?: string;
  elementId?: string;
  property?: string;
  timestamp: string; // ISO 8601
}

export type EditRecord =
  | ClassEditRecord
  | StyleEditRecord
  | TextEditRecord
  | AttributeEditRecord
  | DeleteEditRecord
  | DuplicateEditRecord
  | InsertEditRecord
  | MoveEditRecord;

export type SaveRequestEdit =
  | { kind: "class"; structuralPath: string; newClassList: string[] }
  | { kind: "style"; structuralPath: string; property?: EditableProperty; styleProperty: string; newStyleValue: string; viewport?: "desktop" | "tablet" | "mobile" }
  | { kind: "text"; structuralPath: string; newText: string }
  | { kind: "attribute"; structuralPath: string; attributeName: string; newValue: string }
  | { kind: "delete"; structuralPath: string }
  | { kind: "duplicate"; structuralPath: string }
  | { kind: "insert"; structuralPath: string; position: "inside" | "after" | "before"; snippet: string }
  | { kind: "move"; structuralPath: string; targetPath: string; position: "before" | "after" | "inside" };

export interface SaveRequest {
  html: string;
  edits: SaveRequestEdit[];
}

export interface SaveConflict {
  structuralPath: string;
  reason: "not-found" | "ambiguous" | "void-element" | "invalid-move-ancestor";
}

export type SaveResponse =
  | { ok: true; html: string; conflicts?: SaveConflict[] }
  | { ok: false; conflicts: SaveConflict[]; html?: string };

export interface LoadedFile {
  name: string;
  content: string;
  handle?: FileSystemFileHandle | null;
}
