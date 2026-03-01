import type { PageJSON } from "../lib/editor/types";

export const pageData: PageJSON = {
  order: ["header", "content"],
  sections: {
    header: {
      id: "header",
      type: "container",
      settings: {},
    },
    content: {
      id: "content",
      type: "rich-text",
      settings: {
        heading: "About Us",
      },
      blocks: [
        {
          id: "b1",
          type: "text",
          settings: {
            text: "We are building a modern block editor.",
          },
        },
        {
          id: "b4",
          type: "link",
          settings: {
            label: "Contact",
            href: "/contact",
          },
        },
        {
          id: "b5",
          type: "button",
          settings: {
            label: "Click me",
          },
        },
        {
          id: "b6",
          type: "quote",
          settings: {
            text: "Hello world, this is quote",
          },
        },
      ],
    },
  },
};
