type ModalAction = {
  label: string;
  onClick: (close: () => void) => void;
  className?: string;
};

export class UI {
  createModal(options: {
    title?: string;
    width?: string;
    height?: string;
    content: HTMLElement;
    actions?: ModalAction[];
  }) {
    const {
      title = "Modal",
      width = "80%",
      height = "90%",
      content,
      actions = [],
    } = options;

    const modalContainer = document.createElement("div");
    modalContainer.classList.add("modal-container");

    Object.assign(modalContainer.style, {
      position: "fixed",
      inset: "0",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "9999",
    });

    const modalBox = document.createElement("div");
    modalBox.className = "modal-box";
    Object.assign(modalBox.style, {
      width,
      height,
      backgroundColor: "#fff",
      borderRadius: "8px",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
    });

    modalContainer.appendChild(modalBox);
    document.body.appendChild(modalContainer);

    const header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 16px",
      backgroundColor: "#f8f8f8",
      borderBottom: "1px solid #ddd",
    });

    const titleEl = document.createElement("span");
    titleEl.textContent = title;

    const actionsContainer = document.createElement("div");
    actionsContainer.style.display = "flex";
    actionsContainer.style.gap = "8px";

    // Custom buttons
    actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.className = "modal-actions";
      btn.textContent = action.label;
      if (action.className) btn.classList.add(action.className);

      btn.onclick = () => action.onClick(close);

      actionsContainer.appendChild(btn);
    });

    // defauly close button
    const closeButton = document.createElement("button");
    closeButton.className = "modal-actions";
    closeButton.textContent = "Close";

    header.appendChild(titleEl);
    header.appendChild(actionsContainer);
    header.appendChild(closeButton);
    modalBox.appendChild(header);

    const body = document.createElement("div");
    Object.assign(body.style, {
      flex: "1",
      padding: "16px",
      overflowY: "auto",
    });

    body.appendChild(content);
    modalBox.appendChild(body);

    const close = () => {
      document.removeEventListener("keydown", escHandler);
      modalContainer.remove();
    };

    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    closeButton.onclick = close;

    modalContainer.onclick = (e) => {
      if (e.target === modalContainer) close();
    };

    document.addEventListener("keydown", escHandler);

    return { close };
  }

  createJSONModal(data: unknown) {
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(data, null, 2);

    return this.createModal({
      title: "JSON Viewer",
      content: pre,
    });
  }
}
