import type { SettingSchema } from "../types";

export class PluginHelper {
  static BaseStyleSchema: SettingSchema[] = [
    { key: "color", label: "Color", type: "color" },
    { key: "backgroundColor", label: "Background Color", type: "color" },
    { key: "height", label: "Height", type: "text" },
    { key: "width", label: "Width", type: "text" },

    // padding
    { key: "paddingTop", label: "Padding Top", type: "text" },
    { key: "paddingRight", label: "Padding Right", type: "text" },
    { key: "paddingBottom", label: "Padding Bottom", type: "text" },
    { key: "paddingLeft", label: "Padding Left", type: "text" },

    // margin
    { key: "marginTop", label: "Margin Top", type: "text" },
    { key: "marginRight", label: "Margin Right", type: "text" },
    { key: "marginBottom", label: "Margin Bottom", type: "text" },
    { key: "marginLeft", label: "Margin Left", type: "text" },

    // border
    { key: "borderRadius", label: "Border Radius", type: "text" },
    { key: "borderWidth", label: "Border Width", type: "text" },
    { key: "borderColor", label: "Border Color", type: "color" },

    // display & position
    {
      key: "display",
      label: "Display",
      type: "select",
      options: ["block", "flex", "inline", "inline-block", "none"],
    },
    {
      key: "position",
      label: "Position",
      type: "select",
      options: ["static", "relative", "absolute", "fixed", "sticky"],
    },
    { key: "top", label: "Top", type: "text" },
    { key: "right", label: "Right", type: "text" },
    { key: "left", label: "Left", type: "text" },
    { key: "bottom", label: "Bottom", type: "text" },

    // font
    {
      key: "font",
      label: "Font",
      type: "select",
      options: ["none", "Arial", "Helvetica", "Times New Roman"],
    },
    {
      key: "fontSize",
      label: "Font Size",
      type: "select",
      options: ["none", "12px", "14px", "16px", "18px", "20px"],
    },
    {
      key: "fontWeight",
      label: "Font Weight",
      type: "select",
      options: ["none", "normal", "bold", "bolder", "lighter"],
    },
    {
      key: "fontStyle",
      label: "Font Style",
      type: "select",
      options: ["none", "normal", "italic", "oblique"],
    },
    {
      key: "lineHeight",
      label: "Line Height",
      type: "select",
      options: ["none", "1", "1.5", "2", "2.5"],
    },
    {
      key: "textAlign",
      label: "Text Align",
      type: "select",
      options: ["none", "left", "center", "right"],
    },
    {
      key: "textDecoration",
      label: "Text Decoration",
      type: "select",
      options: ["none", "underline", "overline", "line-through"],
    },
    {
      key: "textTransform",
      label: "Text Transform",
      type: "select",
      options: ["none", "uppercase", "lowercase", "capitalize"],
    },
    { key: "letterSpacing", label: "Letter Spacing", type: "text" },
    {
      key: "float",
      label: "Float",
      type: "select",
      options: ["none", "left", "right"],
    },
  ];

  static applyBaseStyles(el: HTMLElement, settings: Record<string, any>) {
    if (settings.color) {
      el.style.color = settings.color;
    }
    if (settings.backgroundColor) {
      el.style.backgroundColor = settings.backgroundColor;
    }
    if (settings.height) {
      el.style.height = `${settings.height}`;
    }
    if (settings.width) {
      el.style.width = `${settings.width}`;
    }
    // padding
    if (settings.paddingTop) {
      el.style.paddingTop = `${settings.paddingTop}`;
    }
    if (settings.paddingRight) {
      el.style.paddingRight = `${settings.paddingRight}`;
    }
    if (settings.paddingBottom) {
      el.style.paddingBottom = `${settings.paddingBottom}`;
    }
    if (settings.paddingLeft) {
      el.style.paddingLeft = `${settings.paddingLeft}`;
    }
    // margin
    if (settings.marginTop) {
      el.style.marginTop = `${settings.marginTop}`;
    }
    if (settings.marginRight) {
      el.style.marginRight = `${settings.marginRight}`;
    }
    if (settings.marginBottom) {
      el.style.marginBottom = `${settings.marginBottom}`;
    }
    if (settings.marginLeft) {
      el.style.marginLeft = `${settings.marginLeft}`;
    }
    // border
    if (settings.borderRadius) {
      el.style.borderRadius = `${settings.borderRadius}`;
    }
    if (settings.borderWidth) {
      el.style.borderWidth = `${settings.borderWidth}`;
    }
    if (settings.borderColor) {
      el.style.borderColor = settings.borderColor;
    }
    // display
    if (settings.display) {
      el.style.display = settings.display;
    }
    // positions
    if (settings.position) {
      el.style.position = settings.position;
    }
    if (settings.top) {
      el.style.top = settings.top;
    }
    if (settings.right) {
      el.style.right = settings.right;
    }
    if (settings.left) {
      el.style.left = settings.left;
    }
    if (settings.bottom) {
      el.style.bottom = settings.bottom;
    }
    // font
    if (settings.font) {
      el.style.fontFamily = settings.font;
    }
    if (settings.fontSize) {
      el.style.fontSize = settings.fontSize;
    }
    // font weight
    if (settings.fontWeight) {
      el.style.fontWeight = settings.fontWeight;
    }
    // text decoration
    if (settings.textDecoration) {
      el.style.textDecoration = settings.textDecoration;
    }
    // text transform
    if (settings.textTransform) {
      el.style.textTransform = settings.textTransform;
    }
    // letter spacing
    if (settings.letterSpacing) {
      el.style.letterSpacing = settings.letterSpacing;
    }
    // line height
    if (settings.lineHeight) {
      el.style.lineHeight = settings.lineHeight;
    }
    // text alignment
    if (settings.textAlign) {
      el.style.textAlign = settings.textAlign;
    }
  }
}
