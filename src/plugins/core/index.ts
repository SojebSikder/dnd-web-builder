import type { Plugin } from "../../core/types";
import { buttonBlock } from "./blocks/button";
import { headingBlock } from "./blocks/heading";
import { iconTextBlock } from "./blocks/icon-text";
import { imageBlock } from "./blocks/image";
import { quoteBlock } from "./blocks/quote";
import { spacerBlock } from "./blocks/spacer";
import { textBlock } from "./blocks/text";
import { videoBlock } from "./blocks/video";
import { columnsSection } from "./sections/columns";
import { contactFormSection } from "./sections/contact-form";
import { containerSection } from "./sections/container";
import { dividerSection } from "./sections/divider";
import { faqSection } from "./sections/faq";
import { gallerySection } from "./sections/gallery";
import { heroSection } from "./sections/hero";
import { imageWithTextSection } from "./sections/image-with-text";
import { newsletterSection } from "./sections/newsletter";
import { richTextSection } from "./sections/rich-text";
import { spacerSection } from "./sections/spacer";
import { videoSection } from "./sections/video";

/** Generic, commerce-agnostic sections & blocks. */
export const corePlugin: Plugin = {
  name: "core",
  sections: [
    heroSection,
    richTextSection,
    imageWithTextSection,
    columnsSection,
    containerSection,
    gallerySection,
    faqSection,
    newsletterSection,
    contactFormSection,
    videoSection,
    spacerSection,
    dividerSection,
  ],
  blocks: [headingBlock, textBlock, imageBlock, buttonBlock, quoteBlock, videoBlock, spacerBlock, iconTextBlock],
};
