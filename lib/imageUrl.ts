// src/lib/imageUrl.ts
import { sanityClient } from "@/scripts/sanityClient";
import ImageUrlBuilder from "@sanity/image-url";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

// Initialize builder once
const builder = ImageUrlBuilder(sanityClient);

/**
 * Generate a Sanity image URL for React Native usage.
 *
 * @param {SanityImageSource} source - Sanity image reference object
 * @returns {string} - Direct URL to the image (use in Image `source.uri`)
 *
 * @example
 * const url = imageUrl(item.product.image, 400);
 */
export function imageUrl(source: SanityImageSource, width?: number) {
  if (!source) return "";
  const image = builder.image(source);
  return width ? image.width(width).url() : image.url();
}
