import { useEffect, useState } from "react";

import { sanityClient } from "@/scripts/sanityClient";
import { CatalogCategory, CatalogProduct } from "@/types/catalog";

const PRODUCTS_QUERY = `*[_type == "product"] | order(isHot desc, name asc) {
  _id,
  name,
  slug,
  description,
  price,
  salePrice,
  stock,
  isHot,
  "imageUrl": image.asset->url,
  "galleryUrls": gallery[].asset->url,
  variants[]{
    _key,
    name,
    price,
    salePrice,
    "imageUrl": image.asset->url
  },
  "categories": categories[]->{
    _id,
    title,
    slug
  }
}`;

const CATEGORIES_QUERY = `*[_type == "category"] | order(title asc) {
  _id,
  title,
  slug,
  description,
  parent,
  "imageUrl": image.asset->url,
  "bannerImageUrl": bannerImage.asset->url
}`;

let productsCache: CatalogProduct[] | null = null;
let categoriesCache: CatalogCategory[] | null = null;
let productsInFlight: Promise<CatalogProduct[]> | null = null;
let categoriesInFlight: Promise<CatalogCategory[]> | null = null;

async function fetchProductsCached(force = false) {
  if (!force && productsCache) return productsCache;
  if (!force && productsInFlight) return productsInFlight;

  productsInFlight = sanityClient
    .fetch<CatalogProduct[]>(PRODUCTS_QUERY)
    .then((data) => {
      productsCache = Array.isArray(data) ? data : [];
      return productsCache;
    })
    .catch(() => [])
    .finally(() => {
      productsInFlight = null;
    });

  return productsInFlight;
}

async function fetchCategoriesCached(force = false) {
  if (!force && categoriesCache) return categoriesCache;
  if (!force && categoriesInFlight) return categoriesInFlight;

  categoriesInFlight = sanityClient
    .fetch<CatalogCategory[]>(CATEGORIES_QUERY)
    .then((data) => {
      categoriesCache = Array.isArray(data) ? data : [];
      return categoriesCache;
    })
    .catch(() => [])
    .finally(() => {
      categoriesInFlight = null;
    });

  return categoriesInFlight;
}

export function useCatalogData() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    setLoading(true);
    const [nextProducts, nextCategories] = await Promise.all([
      fetchProductsCached(true),
      fetchCategoriesCached(true),
    ]);
    setProducts(nextProducts);
    setCategories(nextCategories);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      const [nextProducts, nextCategories] = await Promise.all([
        fetchProductsCached(),
        fetchCategoriesCached(),
      ]);
      if (!active) return;
      setProducts(nextProducts);
      setCategories(nextCategories);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  return { products, categories, loading, refetch };
}
