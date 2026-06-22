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

export function usePurchasedProducts() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["purchased-products"],
    queryFn: () => accountApi.listDownloads(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    select: (downloads) =>
      new Set(downloads.map((d) => d.product_id).filter(Boolean) as string[]),
  });
}
