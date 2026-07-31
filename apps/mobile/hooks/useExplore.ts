import { useInfiniteQuery } from "@tanstack/react-query";
import { contentApi, type ExploreFilters, type TrekListItem } from "@/lib/mobileApi";

const PAGE_SIZE = 24;

export function useExplore(filters: ExploreFilters, options?: { enabled?: boolean }) {
  const query = useInfiniteQuery({
    queryKey: ["explore", filters],
    queryFn: ({ pageParam }) => contentApi.exploreTreks(filters, PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });

  const pages: TrekListItem[] = query.data?.pages.flat() ?? [];

  return {
    pages,
    isLoading: query.isLoading,
    isFetchingMore: query.isFetchingNextPage,
    hasMore: !!query.hasNextPage,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    },
    refresh: () => query.refetch(),
  };
}
