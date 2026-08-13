export const publicProductColumns = {
  id: true,
  name: true,
  description: true,
  price: true,
  imageUrl: true,
  servesPeople: true,
  originalPrice: true,
  isFeatured: true,
  sortOrder: true,
} as const;

export function toPublicProduct(product: {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  servesPeople: number | null;
  originalPrice: string | null;
  isFeatured: boolean;
  sortOrder: number;
  categories: Array<{ categoryId: string }>;
  addons: Array<{ addon: {
    id: string;
    name: string;
    price: string;
    imageUrl: string | null;
    category: { id: string; name: string } | null;
  } | null }>;
}) {
  return {
    ...product,
    addons: product.addons.flatMap((relation) => relation.addon ? [{ addon: relation.addon }] : []),
  };
}
