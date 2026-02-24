export interface CatalogCategory {
  _id: string;
  title: string;
  slug?: { current?: string };
  description?: unknown;
  imageUrl?: string;
  bannerImageUrl?: string;
  parent?: {
    _ref?: string;
  };
}

export interface CatalogProduct {
  _id: string;
  name: string;
  slug?: { current?: string };
  description?: any;
  price?: number;
  salePrice?: number;
  stock?: number;
  isHot?: boolean;
  imageUrl?: string;
  galleryUrls?: string[];
  variants?: {
    _key?: string;
    name?: string;
    imageUrl?: string;
    price?: number;
    salePrice?: number;
  }[];
  categories?: {
    _id: string;
    title: string;
    slug?: { current?: string };
  }[];
}
