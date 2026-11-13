import { normalizeOptions } from "../../core/fields";
import { safeUrl } from "../../core/html";
import type { FieldSchema, FieldType } from "../../core/types";
import type { EditorPickers } from "../types";
import { h, icon } from "../ui/dom";
import { richTextControl } from "./richtext";

export interface FieldContext {
  field: FieldSchema;
  value: unknown;
  /** id for the primary input (the panel's <label for> points to it) */
  id: string;
  /** `undefined` removes the setting (falls back to defaults) */
  onChange: (value: unknown) => void;
  /** ends the undo coalescing run (blur / change) */
  onCommitBoundary: () => void;
  pickers?: EditorPickers;
}

export type FieldRenderer = (ctx: FieldContext) => HTMLElement;

const str = (v: unknown) => (v === null || v === undefined ? "" : typeof v === "string" ? v : String(v));

function textInput(ctx: FieldContext, type = "text", extra: Record<string, string> = {}): HTMLInputElement {
  const input = h("input", {
    class: "wbe-input",
    attrs: { id: ctx.id, type, placeholder: ctx.field.placeholder ?? "", autocomplete: "off", ...extra },
    value: str(ctx.value),
  });
  input.addEventListener("input", () => ctx.onChange(input.value));
  input.addEventListener("change", ctx.onCommitBoundary);
  return input;
}

function pickerButton(label: string, picker: (() => Promise<string | null>) | undefined, apply: (v: string) => void) {
  if (!picker) return null;
  return h("button", {
    class: "wbe-btn wbe-btn--sm",
    attrs: { type: "button" },
    text: label,
    on: {
      click: async () => {
        try {
          const v = await picker();
          if (typeof v === "string" && v) apply(v);
        } catch (err) {
          console.error("[dnd-web-builder] picker failed", err);
        }
      },
    },
  });
}

function clearButton(onClick: () => void, label = "Reset to default") {
  return h("button", {
    class: "wbe-icon-btn wbe-icon-btn--sm",
    attrs: { type: "button", title: label, "aria-label": label },
    html: icon("close", 12),
    on: { click: onClick },
  });
}

const text: FieldRenderer = (ctx) => textInput(ctx);

const url: FieldRenderer = (ctx) => textInput(ctx, "text", { inputmode: "url", spellcheck: "false" });

const textarea: FieldRenderer = (ctx) => {
  const ta = h("textarea", {
    class: "wbe-input wbe-textarea",
    attrs: { id: ctx.id, rows: 3, placeholder: ctx.field.placeholder ?? "" },
    value: str(ctx.value),
  });
  ta.addEventListener("input", () => ctx.onChange(ta.value));
  ta.addEventListener("change", ctx.onCommitBoundary);
  return ta;
};

const list: FieldRenderer = (ctx) => {
  const ta = textarea(ctx) as HTMLTextAreaElement;
  ta.rows = 5;
  ta.classList.add("wbe-textarea--mono");
  ta.spellcheck = false;
  return ta;
};

const richtext: FieldRenderer = (ctx) =>
  richTextControl({
    id: ctx.id,
    value: str(ctx.value),
    placeholder: ctx.field.placeholder,
    onChange: (html) => ctx.onChange(html),
    onBlur: ctx.onCommitBoundary,
  });

function parseNum(raw: string, f: FieldSchema): number | undefined {
  if (raw.trim() === "") return undefined;
  let n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  if (typeof f.min === "number") n = Math.max(f.min, n);
  if (typeof f.max === "number") n = Math.min(f.max, n);
  return n;
}

const numberField: FieldRenderer = (ctx) => {
  const f = ctx.field;
  const input = h("input", {
    class: "wbe-input wbe-input--num",
    attrs: { id: ctx.id, type: "number", min: f.min, max: f.max, step: f.step ?? "any", placeholder: f.placeholder ?? "" },
    value: str(ctx.value),
  });
  input.addEventListener("input", () => ctx.onChange(parseNum(input.value, f)));
  input.addEventListener("change", ctx.onCommitBoundary);
  return h("div", { class: "wbe-row" }, input, f.unit ? h("span", { class: "wbe-unit", text: f.unit }) : null);
};

const range: FieldRenderer = (ctx) => {
  const f = ctx.field;
  const min = f.min ?? 0;
  const max = f.max ?? 100;
  const has = typeof ctx.value === "number" || (typeof ctx.value === "string" && ctx.value.trim() !== "");
  const slider = h("input", {
    class: "wbe-range",
    attrs: { type: "range", min, max, step: f.step ?? 1, "aria-label": f.label, tabindex: "-1" },
    value: has ? str(ctx.value) : String(min),
  });
  const num = h("input", {
    class: "wbe-input wbe-input--num",
    attrs: { id: ctx.id, type: "number", min, max, step: f.step ?? 1, placeholder: "auto" },
    value: has ? str(ctx.value) : "",
  });
  const wrap = h("div", { class: `wbe-row wbe-range-row${has ? "" : " wbe-is-unset"}` });
  const set = (n: number | undefined, from: "slider" | "num" | "reset") => {
    if (from !== "slider") slider.value = n === undefined ? String(min) : String(n);
    if (from !== "num") num.value = n === undefined ? "" : String(n);
    wrap.classList.toggle("wbe-is-unset", n === undefined);
    ctx.onChange(n);
  };
  slider.addEventListener("input", () => set(Number(slider.value), "slider"));
  slider.addEventListener("change", ctx.onCommitBoundary);
  num.addEventListener("input", () => set(parseNum(num.value, f), "num"));
  num.addEventListener("change", ctx.onCommitBoundary);
  wrap.append(slider, num, f.unit ? h("span", { class: "wbe-unit", text: f.unit }) : "");
  if (f.default === undefined) wrap.append(clearButton(() => set(undefined, "reset")));
  return wrap;
};

const boolean: FieldRenderer = (ctx) => {
  const input = h("input", {
    class: "wbe-switch__input",
    attrs: { id: ctx.id, type: "checkbox", role: "switch" },
    checked: ctx.value === true || ctx.value === "true",
  });
  input.addEventListener("change", () => {
    ctx.onChange(input.checked);
    ctx.onCommitBoundary();
  });
  return h("span", { class: "wbe-switch" }, input, h("span", { class: "wbe-switch__track", attrs: { "aria-hidden": "true" } }));
};

const select: FieldRenderer = (ctx) => {
  const options = normalizeOptions(ctx.field.options);
  const current = str(ctx.value);
  const sel = h(
    "select",
    { class: "wbe-input wbe-select", attrs: { id: ctx.id } },
    options.map((o) => h("option", { attrs: { value: o.value }, text: o.label })),
  );
  if (current && !options.some((o) => o.value === current)) {
    sel.append(h("option", { attrs: { value: current }, text: current }));
  }
  sel.value = current;
  sel.addEventListener("change", () => {
    ctx.onChange(sel.value === "" ? undefined : sel.value);
    ctx.onCommitBoundary();
  });
  return sel;
};

const HEX6 = /^#[0-9a-f]{6}$/i;

const color: FieldRenderer = (ctx) => {
  const value = str(ctx.value);
  const swatch = h("input", {
    class: "wbe-color__swatch",
    attrs: { type: "color", "aria-label": `${ctx.field.label} picker`, tabindex: "-1" },
    value: HEX6.test(value) ? value : "#000000",
  });
  const textEl = h("input", {
    class: "wbe-input wbe-color__text",
    attrs: { id: ctx.id, type: "text", placeholder: "Default", spellcheck: "false", autocomplete: "off" },
    value,
  });
  const wrap = h("div", { class: `wbe-row wbe-color${value ? "" : " wbe-is-unset"}` });
  const set = (v: string, from: "swatch" | "text") => {
    if (from === "swatch") textEl.value = v;
    else if (HEX6.test(v)) swatch.value = v;
    wrap.classList.toggle("wbe-is-unset", !v);
    ctx.onChange(v.trim() ? v.trim() : undefined);
  };
  swatch.addEventListener("input", () => set(swatch.value, "swatch"));
  swatch.addEventListener("change", ctx.onCommitBoundary);
  textEl.addEventListener("input", () => set(textEl.value, "text"));
  textEl.addEventListener("change", ctx.onCommitBoundary);
  wrap.append(
    swatch,
    textEl,
    clearButton(() => {
      textEl.value = "";
      set("", "text");
      ctx.onCommitBoundary();
    }, "Clear color"),
  );
  return wrap;
};

const image: FieldRenderer = (ctx) => {
  const preview = h("div", { class: "wbe-image__preview" });
  const showPreview = (v: string) => {
    const u = safeUrl(v, "");
    preview.textContent = "";
    if (u && u !== "#") preview.append(h("img", { attrs: { src: u, alt: "" } }));
    else preview.innerHTML = icon("image", 20);
  };
  showPreview(str(ctx.value));
  const input = textInput(ctx, "text", { inputmode: "url", spellcheck: "false", placeholder: ctx.field.placeholder ?? "https://…" });
  input.addEventListener("input", () => showPreview(input.value));
  const apply = (v: string) => {
    input.value = v;
    showPreview(v);
    ctx.onChange(v || undefined);
    ctx.onCommitBoundary();
  };
  return h(
    "div",
    { class: "wbe-image" },
    preview,
    h(
      "div",
      { class: "wbe-image__controls" },
      input,
      h(
        "div",
        { class: "wbe-row" },
        pickerButton("Choose image", ctx.pickers?.image, apply),
        str(ctx.value) || !ctx.pickers?.image
          ? h("button", { class: "wbe-btn wbe-btn--sm wbe-btn--ghost", attrs: { type: "button" }, text: "Remove", on: { click: () => apply("") } })
          : null,
      ),
    ),
  );
};

function handlePicker(kind: "product" | "collection" | "category"): FieldRenderer {
  return (ctx) => {
    const input = textInput(ctx, "text", { spellcheck: "false", placeholder: ctx.field.placeholder ?? `${kind}-handle` });
    const picker = ctx.pickers?.[kind];
    const btn = pickerButton("Choose", picker, (v) => {
      input.value = v;
      ctx.onChange(v);
      ctx.onCommitBoundary();
    });
    return h("div", { class: "wbe-row" }, input, btn);
  };
}

/** One renderer per field type. Hosts may extend this map for custom field types. */
export const fieldRenderers: Record<FieldType, FieldRenderer> = {
  text,
  textarea,
  richtext,
  number: numberField,
  range,
  boolean,
  select,
  color,
  image,
  url,
  product: handlePicker("product"),
  collection: handlePicker("collection"),
  category: handlePicker("category"),
  list,
};

export function renderField(ctx: FieldContext): HTMLElement {
  const r = fieldRenderers[ctx.field.type] ?? text;
  return r(ctx);
}
