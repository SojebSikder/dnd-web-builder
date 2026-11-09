import type { FieldOption, FieldSchema, Settings } from "./types";

/** Shared style fields (group "style"). All optional — unset values fall back to the theme CSS. */
export const styleFields: FieldSchema[] = [
  {
    key: "paddingTop",
    label: "Padding top",
    type: "range",
    group: "style",
    min: 0,
    max: 240,
    step: 4,
    unit: "px",
  },
  {
    key: "paddingBottom",
    label: "Padding bottom",
    type: "range",
    group: "style",
    min: 0,
    max: 240,
    step: 4,
    unit: "px",
  },
  {
    key: "marginTop",
    label: "Margin top",
    type: "range",
    group: "style",
    min: 0,
    max: 240,
    step: 4,
    unit: "px",
  },
  {
    key: "marginBottom",
    label: "Margin bottom",
    type: "range",
    group: "style",
    min: 0,
    max: 240,
    step: 4,
    unit: "px",
  },
  {
    key: "backgroundColor",
    label: "Background color",
    type: "color",
    group: "style",
  },
  { key: "textColor", label: "Text color", type: "color", group: "style" },
  {
    key: "textAlign",
    label: "Text alignment",
    type: "select",
    group: "style",
    options: [
      { label: "Default", value: "" },
      { label: "Left", value: "left" },
      { label: "Center", value: "center" },
      { label: "Right", value: "right" },
    ],
  },
  {
    key: "maxWidth",
    label: "Content max width",
    type: "number",
    group: "style",
    min: 240,
    max: 2400,
    step: 10,
    unit: "px",
    placeholder: "Theme default",
  },
  {
    key: "borderRadius",
    label: "Corner radius",
    type: "range",
    group: "style",
    min: 0,
    max: 64,
    step: 1,
    unit: "px",
  },
];

/** Advanced fields (group "advanced"). */
export const advancedFields: FieldSchema[] = [
  {
    key: "cssClass",
    label: "CSS class",
    type: "text",
    group: "advanced",
    placeholder: "my-class another-class",
    help: "Extra classes added to the wrapper element.",
  },
  {
    key: "customCss",
    label: "Custom CSS",
    type: "textarea",
    group: "advanced",
    placeholder: "h2 { letter-spacing: .02em; }",
    help: "Scoped to this element. Declarations or nested rules.",
  },
];

/** Parses a length: numbers → px; strings like "24", "24px", "1.5rem", "10%" are accepted. */
export function cssLength(value: unknown, min = 0, max = 10000): string | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return `${Math.min(max, Math.max(min, value))}px`;
  }
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;
  const m = /^(-?\d+(?:\.\d+)?)(px|rem|em|%|vh|vw|svh|dvh|ch)?$/.exec(v);
  if (!m) return null;
  const n = Number(m[1]);
  if (!m[2] || m[2] === "px") return `${Math.min(max, Math.max(min, n))}px`;
  return n < min && min >= 0 ? null : `${n}${m[2]}`;
}

/** Accepts hex, rgb(a)/hsl(a)/oklch(), named colors, `transparent` and `var(--x)`. */
export function cssColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;
  if (/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return v;
  if (
    /^(?:rgba?|hsla?|oklch|oklab|lab|lch)\(\s*[-\d.%\s,/a-z]*\)$/i.test(v) &&
    !/[;{}<>]/.test(v)
  )
    return v;
  if (/^var\(--[a-z0-9_-]+\)$/i.test(v)) return v;
  if (/^[a-z]{3,20}$/i.test(v)) return v.toLowerCase();
  return null;
}

/** Builds a safe inline style string from the `styleFields` keys. Invalid values are ignored. */
export function styleAttr(settings: Settings): string {
  if (!settings || typeof settings !== "object") return "";
  const decls: string[] = [];
  const len = (prop: string, key: string, min = 0, max = 2000) => {
    const v = cssLength(settings[key], min, max);
    if (v !== null) decls.push(`${prop}: ${v}`);
  };

  len("padding-top", "paddingTop");
  len("padding-bottom", "paddingBottom");
  len("margin-top", "marginTop", -400);
  len("margin-bottom", "marginBottom", -400);
  const bg = cssColor(settings.backgroundColor);

  if (bg) decls.push(`background-color: ${bg}`);

  const fg = cssColor(settings.textColor);

  if (fg) decls.push(`color: ${fg}`, `--wb-color-text: ${fg}`);
  const align = settings.textAlign;

  if (align === "left" || align === "center" || align === "right")
    decls.push(`text-align: ${align}`);

  const mw = settings.maxWidth;

  if (mw !== "" && mw !== 0 && mw !== null && mw !== undefined) {
    const v = cssLength(mw, 0, 10000);
    if (v !== null) decls.push(`--wb-max-width: ${v}`);
  }
  len("border-radius", "borderRadius", 0, 999);
  return decls.join("; ");
}

/** Resolution order: schema defaults < definition defaults < node settings (undefined is ignored). */
export function resolveSettings(
  schema: FieldSchema[],
  defaults: Settings | undefined,
  settings: Settings,
): Settings {
  const out: Settings = {};
  for (const f of schema ?? []) {
    if (f && f.default !== undefined) out[f.key] = f.default;
  }
  if (defaults) {
    for (const [k, v] of Object.entries(defaults))
      if (v !== undefined) out[k] = v;
  }
  if (settings && typeof settings === "object") {
    for (const [k, v] of Object.entries(settings))
      if (v !== undefined) out[k] = v;
  }
  return out;
}

/** Normalises select options to `{label, value}`. */
export function normalizeOptions(
  options: FieldSchema["options"],
): FieldOption[] {
  return (options ?? []).map((o) =>
    typeof o === "string" ? { label: o, value: o } : o,
  );
}
