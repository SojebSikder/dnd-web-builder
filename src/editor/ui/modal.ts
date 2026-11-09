import { h, icon } from "./dom";

export interface ModalAction {
  label: string;
  primary?: boolean;
  onClick: (close: () => void) => void | Promise<void>;
}

export interface ModalOptions {
  title?: string;
  content: HTMLElement;
  actions?: ModalAction[];
  width?: string;
  /** element the modal is appended to (default: document.body) */
  parent?: HTMLElement;
  onClose?: () => void;
}

export interface ModalHandle {
  close(): void;
  readonly el: HTMLElement;
}

/** Accessible modal dialog (Escape / backdrop click close it). */
export function openModal(opts: ModalOptions): ModalHandle {
  const previouslyFocused = document.activeElement as HTMLElement | null;
  let closed = false;
  const titleId = `wbe-modal-title-${Math.random().toString(36).slice(2, 8)}`;

  const close = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKey, true);
    backdrop.remove();
    opts.onClose?.();
    previouslyFocused?.focus?.();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };

  const closeBtn = h("button", {
    class: "wbe-icon-btn",
    attrs: { type: "button", "aria-label": "Close", title: "Close" },
    html: icon("close"),
    on: { click: close },
  });
  const actions = (opts.actions ?? []).map((a) =>
    h("button", {
      class: `wbe-btn${a.primary ? " wbe-btn--primary" : ""}`,
      attrs: { type: "button" },
      text: a.label,
      on: { click: () => void a.onClick(close) },
    }),
  );
  const box = h(
    "div",
    {
      class: "wbe-modal__box",
      attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": titleId },
      style: opts.width ? { width: opts.width } : undefined,
    },
    h(
      "div",
      { class: "wbe-modal__header" },
      h("h2", { class: "wbe-modal__title", attrs: { id: titleId }, text: opts.title ?? "" }),
      h("div", { class: "wbe-row" }, actions, closeBtn),
    ),
    h("div", { class: "wbe-modal__body" }, opts.content),
  );
  const backdrop = h("div", { class: "wbe-modal wbe-root-portal" }, box);
  backdrop.addEventListener("mousedown", (e) => {
    if (e.target === backdrop) close();
  });
  document.addEventListener("keydown", onKey, true);
  (opts.parent ?? document.body).appendChild(backdrop);
  closeBtn.focus();
  return { close, el: backdrop };
}
