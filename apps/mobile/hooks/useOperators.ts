import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { operatorsApi, type InquiryPayload } from "@/lib/mobileApi";

export function useOperators(region?: string) {
  return useQuery({
    queryKey: ["operators", region ?? "all"],
    queryFn: () => operatorsApi.list(region),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOperatorDetail(slug: string) {
  return useQuery({
    queryKey: ["operator", slug],
    queryFn: () => operatorsApi.getBySlug(slug),
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  });
}

export function useOperatorReviews(slug: string) {
  return useQuery({
    queryKey: ["operator-reviews", slug],
    queryFn: () => operatorsApi.getReviews(slug),
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  });
}

export function useSubmitInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InquiryPayload) => operatorsApi.submitInquiry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
