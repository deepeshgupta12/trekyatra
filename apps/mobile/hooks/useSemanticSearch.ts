import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { contentApi } from "@/lib/mobileApi";

const DEBOUNCE_MS = 800;
const MIN_WORDS = 3;

export function useSemanticSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const wordCount = debouncedQuery.trim().split(/\s+/).filter(Boolean).length;
  const enabled = wordCount > MIN_WORDS;

  return useQuery({
    queryKey: ["semantic-search", debouncedQuery],
    queryFn: () => contentApi.semanticSearch(debouncedQuery),
    enabled,
    staleTime: 60 * 1000,
  });
}
