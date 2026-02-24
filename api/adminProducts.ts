import { sanityClient } from "@/scripts/sanityClient";

type ProductPayload = {
  name: string;
  slug: string;
  descriptionText?: string;
  imageUri?: string;
  galleryUris?: string[];
  price: number;
  salePrice?: number;
  stock: number;
  isHot: boolean;
  categoryIds: string[];
  variants?: {
    name: string;
    imageUri?: string;
    price?: number;
    salePrice?: number;
  }[];
};

function toCategoryRefs(categoryIds: string[]) {
  return categoryIds.map((id) => ({
    _type: "reference",
    _ref: id,
    _key: id,
  }));
}

function filenameFromUri(uri: string, fallback: string) {
  try {
    const path = uri.split("?")[0];
    const maybeName = path.split("/").pop();
    return maybeName && maybeName.includes(".") ? maybeName : fallback;
  } catch {
    return fallback;
  }
}

function toPortableText(descriptionText?: string) {
  const trimmed = descriptionText?.trim() ?? "";
  if (!trimmed) return [];
  return [
    {
      _type: "block",
      _key: `block_${Date.now().toString(36)}`,
      style: "normal",
      markDefs: [],
      children: [
        {
          _type: "span",
          _key: `span_${Date.now().toString(36)}`,
          marks: [],
          text: trimmed,
        },
      ],
    },
  ];
}

async function uploadImageFromUri(uri: string, fallback: string) {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${uri}`);
  }
  const blob = await response.blob();
  const asset = await sanityClient.assets.upload("image", blob, {
    filename: filenameFromUri(uri, fallback),
  });

  return {
    _type: "image",
    asset: { _type: "reference", _ref: asset._id },
  };
}

async function normalizeGallery(galleryUris: string[] = []) {
  const gallery = await Promise.all(
    galleryUris.map(async (uri, index) => {
      const image = await uploadImageFromUri(uri, `gallery-${index + 1}.jpg`);
      return {
        ...image,
        _key: `g_${index}_${Date.now().toString(36)}`,
      };
    })
  );
  return gallery;
}

async function normalizeVariants(
  variants: ProductPayload["variants"] = []
) {
  const normalized = await Promise.all(
    variants.map(async (variant, index) => {
      const item: Record<string, unknown> = {
        _type: "variant",
        _key: `v_${index}_${Date.now().toString(36)}`,
        name: variant.name,
      };

      if (typeof variant.price === "number") item.price = variant.price;
      if (typeof variant.salePrice === "number") item.salePrice = variant.salePrice;
      if (variant.imageUri) {
        item.image = await uploadImageFromUri(
          variant.imageUri,
          `variant-${index + 1}.jpg`
        );
      }
      return item;
    })
  );
  return normalized;
}

export async function createAdminProduct(payload: ProductPayload) {
  try {
    const data: Record<string, unknown> = {
      _type: "product",
      name: payload.name,
      slug: { _type: "slug", current: payload.slug },
      description: toPortableText(payload.descriptionText),
      price: payload.price,
      stock: payload.stock,
      isHot: payload.isHot,
      categories: toCategoryRefs(payload.categoryIds),
    };

    if (payload.salePrice !== undefined) data.salePrice = payload.salePrice;
    if (payload.imageUri) data.image = await uploadImageFromUri(payload.imageUri, "product.jpg");
    if ((payload.galleryUris ?? []).length > 0) {
      data.gallery = await normalizeGallery(payload.galleryUris ?? []);
    }
    if ((payload.variants ?? []).length > 0) {
      data.variants = await normalizeVariants(payload.variants ?? []);
    }

    const res = await sanityClient.create(data);
    return { success: true, res };
  } catch (error: any) {
    console.error("createAdminProduct failed:", error?.message);
    return { success: false, error: error?.message ?? "Unknown error" };
  }
}

export async function updateAdminProduct(id: string, payload: ProductPayload) {
  try {
    const patchData: Record<string, unknown> = {
      name: payload.name,
      slug: { _type: "slug", current: payload.slug },
      description: toPortableText(payload.descriptionText),
      price: payload.price,
      stock: payload.stock,
      isHot: payload.isHot,
      categories: toCategoryRefs(payload.categoryIds),
      salePrice: payload.salePrice ?? null,
      variants: [],
      gallery: [],
    };

    if (payload.imageUri) {
      patchData.image = await uploadImageFromUri(payload.imageUri, "product.jpg");
    }
    if ((payload.galleryUris ?? []).length > 0) {
      patchData.gallery = await normalizeGallery(payload.galleryUris ?? []);
    }
    if ((payload.variants ?? []).length > 0) {
      patchData.variants = await normalizeVariants(payload.variants ?? []);
    }

    const res = await sanityClient.patch(id).set(patchData).commit();
    return { success: true, res };
  } catch (error: any) {
    console.error("updateAdminProduct failed:", error?.message);
    return { success: false, error: error?.message ?? "Unknown error" };
  }
}

export async function deleteAdminProduct(id: string) {
  try {
    await sanityClient.delete(id);
    return { success: true };
  } catch (error: any) {
    console.error("deleteAdminProduct failed:", error?.message);
    return { success: false, error: error?.message ?? "Unknown error" };
  }
}
