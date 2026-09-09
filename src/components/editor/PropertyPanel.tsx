import { useState } from "react";
import type { EditRecord, ThemeMap } from "@/types";
import type { ViewportMode } from "./Toolbar";
import { useChangeSetStore } from "@/store/change-set-store";
import CollapsibleGroup from "./property-panel/CollapsibleGroup";
import LayoutGroup from "./property-panel/LayoutGroup";
import PositionGroup from "./property-panel/PositionGroup";
import TypographyGroup from "./property-panel/TypographyGroup";
import BorderGroup from "./property-panel/BorderGroup";
import ColorGroup from "./property-panel/ColorGroup";
import ImageGroup from "./property-panel/ImageGroup";
import LinkGroup from "./property-panel/LinkGroup";
import FlexGridGroup from "./property-panel/FlexGridGroup";
import EffectsGroup from "./property-panel/EffectsGroup";
import ElementActionsGroup from "./property-panel/ElementActionsGroup";
import SvgGroup from "./property-panel/SvgGroup";
import AdvancedCssGroup from "./property-panel/AdvancedCssGroup";
import ClassesGroup from "./property-panel/ClassesGroup";
import InlineTextEditor from "./InlineTextEditor";
import { classifyElement } from "@/lib/dom/element-classifier";
import {
  MousePointerClick,
  Info,
  SlidersHorizontal,
  Sparkles,
  Monitor,
  Tablet,
  Smartphone,
  Type,
  Palette,
  Maximize2,
  LayoutGrid,
  Square,
  Layers,
  Zap,
  MapPin,
  Image as ImageIcon,
  Link as LinkIcon,
  PenTool,
  Code2,
  Tag,
  SquarePen,
  Scissors,
} from "lucide-react";

interface PropertyPanelProps {
  element: Element | null;
  structuralPath: string | null;
  theme: ThemeMap;
  viewport?: ViewportMode;
  onEdit?: (record: EditRecord) => void;
  onDelete?: (el: Element) => void;
  onDuplicate?: (el: Element) => void;
  onMoveUp?: (el: Element) => void;
  onMoveDown?: (el: Element) => void;
}

export default function PropertyPanel({
  element,
  structuralPath,
  theme,
  viewport = "desktop",
  onEdit,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: PropertyPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const editsCount = useChangeSetStore((s) => s.edits.length);

  if (!element || !structuralPath) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-zinc-500 space-y-3 bg-white dark:bg-[#141414] transition-colors">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] flex items-center justify-center text-slate-500 dark:text-zinc-400">
          <MousePointerClick className="w-5 h-5" />
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">No element selected</div>
        <div className="text-xs max-w-[200px] text-slate-500 dark:text-zinc-400">
          Click any element in the preview to edit its styles and text properties.
        </div>
      </div>
    );
  }

  const tagName = element.tagName.toLowerCase();
  const classification = classifyElement(element);
  const { visiblePanels } = classification;

  const showColors = showAll || visiblePanels.textColor || visiblePanels.backgroundColor;

  return (
    <div key={`${structuralPath}-${viewport}-${editsCount}`} className="text-slate-800 dark:text-zinc-200 bg-white dark:bg-[#141414] transition-colors">
      {/* Selected Element Header with Type Badge and Contextual Filter Mode */}
      <div className="p-3 bg-slate-50 dark:bg-[#090909] flex flex-col gap-2 border-b border-slate-200 dark:border-[#262626]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#0099ff]/15 text-[#0099ff] border border-[#0099ff]/30 uppercase shrink-0">
              &lt;{tagName}&gt;
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${classification.badgeColor}`}>
              {classification.typeLabel}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-[120px] font-mono" title={structuralPath}>
              {element.id ? `#${element.id}` : structuralPath.split(">").pop()}
            </span>
          </div>

          {/* View Mode Toggle: Contextual vs All Properties */}
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            aria-label={showAll ? "Switch to contextual properties" : "Switch to all properties"}
            className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-colors flex items-center gap-1 cursor-pointer select-none shrink-0 ${
              showAll
                ? "bg-[#0099ff]/15 text-[#0099ff] border-[#0099ff]/30 font-semibold"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 bg-slate-100 dark:bg-[#1c1c1c] border-slate-200 dark:border-[#262626] hover:border-slate-300 dark:hover:border-[#333333]"
            }`}
            title={showAll ? "Currently showing all properties. Click for focused contextual view." : "Showing tailored properties for this element. Click to show all properties."}
          >
            {showAll ? <SlidersHorizontal className="w-3 h-3" /> : <Sparkles className="w-3 h-3 text-[#0099ff]" />}
            <span>{showAll ? "All" : "Contextual"}</span>
          </button>
        </div>

        {/* Viewport Styling Cascade Target Indicator */}
        <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-[11px]">
          <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
            {viewport === "desktop" ? (
              <Monitor className="w-3.5 h-3.5 text-[#0099ff]" />
            ) : viewport === "tablet" ? (
              <Tablet className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>Editing Target:</span>
          </span>
          <span className={`font-semibold font-mono ${
            viewport === "desktop"
              ? "text-[#0099ff]"
              : viewport === "tablet"
              ? "text-amber-400"
              : "text-emerald-400"
          }`}>
            {viewport === "desktop" ? "Desktop (Global Base)" : viewport === "tablet" ? "Tablet Override (↓ Mobile)" : "Mobile Override (Only Mobile)"}
          </span>
        </div>
      </div>

      {theme.mode === "none" && (
        <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-600 dark:text-amber-300 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>No Tailwind CDN detected — edits will be written as clean inline styles.</span>
        </div>
      )}

      {/* Quick Element Actions */}
      <CollapsibleGroup groupId="actions" title="Actions" icon={<Scissors className="w-3.5 h-3.5" />} defaultOpen={true}>
        <ElementActionsGroup
          element={element}
          structuralPath={structuralPath}
          onDelete={() => onDelete?.(element)}
          onDuplicate={() => onDuplicate?.(element)}
          onMoveUp={() => onMoveUp?.(element)}
          onMoveDown={() => onMoveDown?.(element)}
        />
      </CollapsibleGroup>

      {/* Classes */}
      <CollapsibleGroup groupId="classes" title="Classes" icon={<Tag className="w-3.5 h-3.5" />} defaultOpen={false}>
        <ClassesGroup
          element={element}
          structuralPath={structuralPath}
          theme={theme}
          onEdit={onEdit}
        />
      </CollapsibleGroup>

      {/* Image & Media */}
      {(showAll || visiblePanels.imageMedia) && (
        <CollapsibleGroup groupId="image-media" title="Image & Media" icon={<ImageIcon className="w-3.5 h-3.5" />} defaultOpen={true}>
          <ImageGroup element={element} structuralPath={structuralPath} theme={theme} viewport={viewport} onEdit={onEdit} />
        </CollapsibleGroup>
      )}

      {/* Link & Navigation */}
      {(showAll || visiblePanels.linkNav) && (
        <CollapsibleGroup groupId="link-nav" title="Link & Navigation" icon={<LinkIcon className="w-3.5 h-3.5" />} defaultOpen={true}>
          <LinkGroup element={element} structuralPath={structuralPath} theme={theme} onEdit={onEdit} />
        </CollapsibleGroup>
      )}

      {/* Typography & Content */}
      {(showAll || visiblePanels.typography || visiblePanels.contentCopy) && (
        <CollapsibleGroup groupId="typography" title="Typography" icon={<Type className="w-3.5 h-3.5" />} defaultOpen={true}>
          <TypographyGroup element={element} structuralPath={structuralPath} theme={theme} viewport={viewport} onEdit={onEdit} />
        </CollapsibleGroup>
      )}

      {/* Colors */}
      {showColors && (
        <CollapsibleGroup groupId="colors" title="Colors" icon={<Palette className="w-3.5 h-3.5" />} defaultOpen={true}>
          <div className="p-4 space-y-3">
            {(showAll || visiblePanels.textColor) && (
              <div>
                <label className="text-xs text-slate-600 dark:text-gray-400 block mb-1.5 font-medium">
                  {classification.category === "svg" ? "Icon / Stroke Color" : "Text Color"}
                </label>
                <ColorGroup element={element} structuralPath={structuralPath} theme={theme} property="text-color" viewport={viewport} onEdit={onEdit} />
              </div>
            )}
            {(showAll || visiblePanels.backgroundColor) && (
              <div className={showAll || visiblePanels.textColor ? "pt-2" : ""}>
                <label className="text-xs text-slate-600 dark:text-gray-400 block mb-1.5 font-medium">Background Color</label>
                <ColorGroup element={element} structuralPath={structuralPath} theme={theme} property="background-color" viewport={viewport} onEdit={onEdit} />
              </div>
            )}
          </div>
        </CollapsibleGroup>
      )}

      {/* Layout & Sizing */}
      {(showAll || visiblePanels.layoutSizing) && (
        <CollapsibleGroup groupId="layout" title="Layout & Sizing" icon={<Maximize2 className="w-3.5 h-3.5" />} defaultOpen={true}>
          <LayoutGroup element={element} structuralPath={structuralPath} theme={theme} viewport={viewport} onEdit={onEdit} />
        </CollapsibleGroup>
      )}

      {/* Flexbox / Grid */}
      {(showAll || visiblePanels.flexGrid) && (
        <CollapsibleGroup groupId="flex-grid" title="Flexbox & Grid" icon={<LayoutGrid className="w-3.5 h-3.5" />} defaultOpen={true}>
          <FlexGridGroup element={element} structuralPath={structuralPath} theme={theme} viewport={viewport} onEdit={onEdit} />
        </CollapsibleGroup>
      )}

      {/* Borders & Radiuses */}
      {(showAll || visiblePanels.border) && (
        <CollapsibleGroup groupId="borders" title="Borders & Radius" icon={<Square className="w-3.5 h-3.5" />} defaultOpen={false}>
          <BorderGroup element={element} structuralPath={structuralPath} theme={theme} viewport={viewport} onEdit={onEdit} />
        </CollapsibleGroup>
      )}

      {/* SVG Styling */}
      {(showAll || classification.category === "svg") && (
        <CollapsibleGroup groupId="svg" title="SVG Vector" icon={<PenTool className="w-3.5 h-3.5" />} defaultOpen={true}>
          <SvgGroup element={element} structuralPath={structuralPath} theme={theme} viewport={viewport} onEdit={onEdit} />
        </CollapsibleGroup>
      )}

      {/* Shadows & Effects */}
      {(showAll || visiblePanels.effects) && (
        <CollapsibleGroup groupId="effects" title="Effects & Shadows" icon={<Zap className="w-3.5 h-3.5" />} defaultOpen={false}>
          <EffectsGroup element={element} structuralPath={structuralPath} theme={theme} viewport={viewport} onEdit={onEdit} />
        </CollapsibleGroup>
      )}

      {/* Position & Layering */}
      {(showAll || visiblePanels.positionLayering) && (
        <CollapsibleGroup groupId="position" title="Position & Layering" icon={<MapPin className="w-3.5 h-3.5" />} defaultOpen={false}>
          <PositionGroup element={element} structuralPath={structuralPath} theme={theme} viewport={viewport} onEdit={onEdit} />
        </CollapsibleGroup>
      )}

      {/* Advanced CSS */}
      <CollapsibleGroup groupId="advanced-css" title="Advanced CSS" icon={<Code2 className="w-3.5 h-3.5" />} defaultOpen={false}>
        <AdvancedCssGroup element={element} structuralPath={structuralPath} theme={theme} onEdit={onEdit} />
      </CollapsibleGroup>
    </div>
  );
}
