/* ─────────────────────────────────────────────────────────
   TEXT SPLITTING UTILITIES
   Used by motion/reveal.js (data-reveal="word-by-word" /
   "letter-by-letter", both the explicit-markup path and the
   lazy auto-detection pass) and motion/hero.js (headline split).
───────────────────────────────────────────────────────── */

// Splits text nodes into word spans — preserves child elements
export function splitWords(el) {
  if (el.dataset.split) return el.querySelectorAll(".ax-word");
  el.dataset.split = "1";
  const words = [];
  function walk(node) {
    if (node.nodeType === 3) {
      const parts = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach((p) => {
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); }
        else if (p) {
          const clip = document.createElement("span");
          clip.style.cssText = "display:inline-block;overflow:hidden;vertical-align:top;";
          const inner = document.createElement("span");
          inner.className = "ax-word";
          inner.style.display = "inline-block";
          inner.textContent = p;
          clip.appendChild(inner);
          frag.appendChild(clip);
          words.push(inner);
        }
      });
      return frag;
    }
    if (node.nodeType === 1 && node.nodeName !== "BR") {
      const kids = Array.from(node.childNodes);
      kids.forEach((k) => { const r = walk(k); if (r) node.replaceChild(r, k); });
    }
    return null;
  }
  Array.from(el.childNodes).forEach((c) => { const r = walk(c); if (r) el.replaceChild(r, c); });
  return words;
}

// Splits text into letter spans — gradient child elements are kept whole (not split)
// to prevent bg-clip-text from breaking. Only plain text nodes get split letter-by-letter.
export function splitLetters(el) {
  if (el.dataset.split) return el.querySelectorAll(".ax-char");
  el.dataset.split = "1";
  const chars = [];

  function walkAndSplit(node) {
    // Plain text node — split by words first, then by characters
    if (node.nodeType === 3) {
      const frag = document.createDocumentFragment();
      // Split by whitespace to identify distinct words
      const words = node.textContent.split(/(\s+)/);

      words.forEach((word) => {
        if (/^\s+$/.test(word)) {
          // Preserve spaces exactly as they are
          frag.appendChild(document.createTextNode(word));
        } else if (word) {
          // Wrap the word in an inline-block container to prevent mid-word breaks
          const wordWrapper = document.createElement("span");
          wordWrapper.className = "ax-word-wrapper";
          wordWrapper.style.display = "inline-block";
          wordWrapper.style.whiteSpace = "nowrap"; // Extra insurance against breaking

          // Now split the word into individual animated characters
          [...word].forEach((ch) => {
            const span = document.createElement("span");
            span.className = "ax-char";
            span.style.display = "inline-block";
            span.textContent = ch;
            wordWrapper.appendChild(span);
            chars.push(span);
          });

          frag.appendChild(wordWrapper);
        }
      });
      return frag;
    }

    if (node.nodeType === 1) {
      const cls = node.className || "";
      // Gradient spans: bg-clip-text breaks when individual chars are split.
      // Instead, wrap the WHOLE element in a single ax-char so it animates as one unit.
      const isGradient = cls.includes("bg-clip-text") || cls.includes("text-transparent");
      if (isGradient) {
        const wrapper = document.createElement("span");
        wrapper.className = "ax-char";
        wrapper.style.display = "inline-block";
        wrapper.appendChild(node.cloneNode(true));
        chars.push(wrapper);
        return wrapper;
      }

      // Regular element — recurse inside it, preserving the wrapper element
      const clone = node.cloneNode(false); // shallow clone keeps class/style
      Array.from(node.childNodes).forEach((child) => {
        const result = walkAndSplit(child);
        clone.appendChild(result || child.cloneNode(true));
      });
      return clone;
    }
    return null;
  }

  const frag = document.createDocumentFragment();
  Array.from(el.childNodes).forEach((child) => {
    const result = walkAndSplit(child);
    if (result) frag.appendChild(result);
  });
  el.innerHTML = "";
  el.appendChild(frag);
  return chars;
}
