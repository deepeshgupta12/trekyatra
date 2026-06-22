import { useQuery } from "@tanstack/react-query";
import { productsApi, accountApi, type Product } from "@/lib/mobileApi";
import { useAuth } from "@/providers/AuthProvider";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => productsApi.listProducts(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(slug: string) {
  return useQuery<Product>({
    queryKey: ["product", slug],
    queryFn: () => productsApi.getProduct(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

// Returns a Map of productId → downloadUrl (null if URL not yet available)
// Use .has(productId) to check ownership, .get(productId) to get the URL
export function usePurchasedProducts() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["purchased-products"],
    queryFn: () => accountApi.listDownloads(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    select: (downloads) =>
      new Map(
        downloads
          .filter((d) => d.product_id)
          .map((d) => [d.product_id as string, d.download_url ?? null]),
      ),
  });
}
