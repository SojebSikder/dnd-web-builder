import type { PageDocument } from "../index";

/** A v2 home page using core sections + the demo data section. */
export const homeDocument: PageDocument = {
  version: 2,
  order: ["s_hero", "s_features", "s_products", "s_story", "s_faq", "s_news"],
  sections: {
    s_hero: {
      id: "s_hero",
      type: "hero",
      settings: {
        heading: "Everyday goods, thoughtfully made",
        subheading: "Small-batch essentials for your home, designed to last.",
        image: "https://picsum.photos/seed/wb-hero/1600/900",
        imageAlt: "Living room with natural light",
        overlayOpacity: 45,
        buttonLabel: "Shop the collection",
        buttonLink: "/collections/all",
        height: "large",
      },
      blocks: [],
    },
    s_features: {
      id: "s_features",
      type: "columns",
      settings: { heading: "Why shop with us", columns: "3", textAlign: "center" },
      blocks: [
        { id: "b_f1", type: "icon-text", settings: { icon: "🚚", title: "Free shipping", text: "On every order over $50." } },
        { id: "b_f2", type: "icon-text", settings: { icon: "↩️", title: "30-day returns", text: "Changed your mind? No problem." } },
        { id: "b_f3", type: "icon-text", settings: { icon: "🌱", title: "Sustainably sourced", text: "Materials we are proud of." } },
      ],
    },
    s_products: {
      id: "s_products",
      type: "featured-products",
      settings: { heading: "Bestsellers", collection: "bestsellers", limit: 4 },
      blocks: [],
    },
    s_story: {
      id: "s_story",
      type: "image-with-text",
      settings: {
        image: "https://picsum.photos/seed/wb-story/1000/750",
        heading: "Our story",
        body: "<p>We started in a tiny workshop with a simple idea: <strong>make fewer, better things</strong>.</p><ul><li>Designed in-house</li><li>Made by independent makers</li></ul>",
        buttonLabel: "Read more",
        buttonLink: "/pages/about",
        imagePosition: "right",
        backgroundColor: "#f7f5f2",
      },
      blocks: [],
    },
    s_faq: { id: "s_faq", type: "faq", settings: {}, blocks: [] },
    s_news: { id: "s_news", type: "newsletter", settings: {}, blocks: [] },
  },
};

/** A legacy v1 document (no version, optional blocks) — normalizeDocument upgrades it. */
export const legacyV1Document = {
  order: ["header", "content"],
  sections: {
    header: { id: "header", type: "container", settings: {} },
    content: {
      id: "content",
      type: "rich-text",
      settings: { heading: "About Us" },
      blocks: [{ id: "b1", type: "text", settings: { text: "We are building a modern block editor." } }],
    },
  },
};
