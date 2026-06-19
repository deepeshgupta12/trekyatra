import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountApi, authMeApi, newsletterApi } from "@/lib/mobileApi";

export function useSavedTreks() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["account", "bookmarks"],
    queryFn: () => accountApi.listBookmarks(),
    staleTime: 60_000,
  });

  const removeMutation = useMutation({
    mutationFn: (slug: string) => accountApi.removeBookmarkBySlug(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account", "bookmarks"] });
    },
  });

  return {
    bookmarks: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    remove: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  };
}

export function useDownloads() {
  const query = useQuery({
    queryKey: ["account", "downloads"],
    queryFn: () => accountApi.listDownloads(),
    staleTime: 120_000,
  });

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const getDownloadUrl = useCallback(async (orderId: string): Promise<string | null> => {
    setDownloadingId(orderId);
    try {
      const res = await accountApi.getDownloadUrl(orderId);
      return res.download_url;
    } catch {
      return null;
    } finally {
      setDownloadingId(null);
    }
  }, []);

  return {
    downloads: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    getDownloadUrl,
    downloadingId,
  };
}

export function useAccountMe() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["account", "me"],
    queryFn: () => authMeApi.getMe(),
    staleTime: 300_000,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { full_name?: string }) => authMeApi.updateMe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account", "me"] });
    },
  });

  return {
    me: query.data ?? null,
    isLoading: query.isLoading,
    updateMe: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

export function useNewsletter() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const subscribe = useCallback(async (email: string) => {
    setStatus("loading");
    try {
      await newsletterApi.subscribe(email);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  return { subscribe, status };
}
