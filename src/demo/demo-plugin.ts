import { escapeAttr, escapeHtml, safeUrl, styleFields, advancedFields, type Plugin } from "../index";

interface DemoProduct {
  title: string;
  price: number;
  image: string;
  handle: string;
}

/** Example third-party plugin: a section that declares remote data via `data()`. */
export const demoPlugin: Plugin = {
  name: "demo-commerce",
  sections: [
    {
      type: "featured-products",
      label: "Featured products",
      icon: "🛍️",
      category: "Commerce",
      schema: [
        { key: "heading", label: "Heading", type: "text", default: "Featured products" },
        { key: "collection", label: "Collection", type: "collection", default: "frontpage" },
        { key: "limit", label: "Products to show", type: "range", min: 2, max: 8, step: 1, default: 4 },
        ...styleFields,
        ...advancedFields,
      ],
      data(section) {
        const handle = String(section.settings.collection || "frontpage");
        const limit = Number(section.settings.limit) || 4;
        return [{ key: `collection:${handle}:${limit}`, type: "collection-products", params: { handle, limit } }];
      },
      render(section, ctx) {
        const s = section.settings;
        const key = `collection:${String(s.collection || "frontpage")}:${Number(s.limit) || 4}`;
        const products = ctx.data[key] as DemoProduct[] | undefined;
        const fmt = (n: number) => `$${n.toFixed(2)}`;
        const cards = products
          ? products
              .map(
                (p) => `<a class="wb-demo-card" href="${escapeAttr(safeUrl(`/products/${p.handle}`))}">
                  <img src="${escapeAttr(safeUrl(p.image))}" alt="" loading="lazy" decoding="async">
                  <span class="wb-demo-card__title">${escapeHtml(p.title)}</span>
                  <span class="wb-demo-card__price">${escapeHtml(fmt(p.price))}</span></a>`,
              )
              .join("")
          : `<p class="wb-text">Loading products…</p>`;
        return `<div class="wb-container"><h2 class="wb-heading wb-section-heading">${escapeHtml(s.heading)}</h2><div class="wb-gallery" style="--wb-columns: 4; --wb-gap: 20px">${cards}</div></div>`;
      },
    },
  ],
};

/** Fake host data provider (simulates network latency). */
export async function demoDataProvider(
  requests: { key: string; type: string; params: Record<string, unknown> }[],
): Promise<Record<string, unknown>> {
  await new Promise((r) => setTimeout(r, 400));
  const out: Record<string, unknown> = {};
  for (const r of requests) {
    if (r.type !== "collection-products") continue;
    const limit = Number(r.params.limit) || 4;
    out[r.key] = Array.from({ length: limit }, (_, i) => ({
      title: `${String(r.params.handle)} item ${i + 1}`,
      price: 19 + i * 7.5,
      image: `https://picsum.photos/seed/${encodeURIComponent(String(r.params.handle))}-${i}/400/400`,
      handle: `item-${i + 1}`,
    }));
  }
  return out;
}
