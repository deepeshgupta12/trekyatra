import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiDelete, apiUploadFile } from "@/lib/mobileApi";

export interface MediaOut {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
}

export interface ReportOut {
  id: string;
  trek_slug: string;
  title: string | null;
  body: string;
  condition: "open" | "caution" | "closed" | "unknown";
  trek_date: string;
  status: string;
  media: MediaOut[];
  created_at: string;
}

export interface ConditionSummary {
  total_reports: number;
  open_pct: number;
  caution_pct: number;
  closed_pct: number;
  unknown_pct: number;
  last_report_date: string | null;
}

export interface ReportPageOut {
  items: ReportOut[];
  total: number;
  page: number;
  has_more: boolean;
  condition_summary: ConditionSummary;
}

export interface ReportIn {
  trek_slug: string;
  title?: string;
  body: string;
  condition: "open" | "caution" | "closed" | "unknown";
  trek_date: string;
  media_ids?: string[];
}

export interface MediaUploadOut {
  id: string;
  url: string;
}

const EMPTY_SUMMARY: ConditionSummary = {
  total_reports: 0,
  open_pct: 0,
  caution_pct: 0,
  closed_pct: 0,
  unknown_pct: 0,
  last_report_date: null,
};

const EMPTY_PAGE: ReportPageOut = {
  items: [],
  total: 0,
  page: 1,
  has_more: false,
  condition_summary: EMPTY_SUMMARY,
};

export function useReports(slug: string) {
  const [data, setData] = useState<ReportPageOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(
    async (p = 1) => {
      try {
        const result = await apiGet<ReportPageOut>(
          `/api/v1/public/treks/${slug}/reports?page=${p}`
        );
        setData((prev) =>
          p === 1
            ? result
            : prev
            ? { ...result, items: [...prev.items, ...result.items] }
            : result
        );
        setPage(p);
      } catch {
        if (p === 1) setData(EMPTY_PAGE);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  function loadMore() {
    if (data?.has_more && !loadingMore) {
      setLoadingMore(true);
      void load(page + 1);
    }
  }

  async function submitReport(input: ReportIn): Promise<ReportOut> {
    return apiPost<ReportOut>("/api/v1/reports", input);
  }

  async function uploadPhoto(
    localUri: string,
    mimeType: string
  ): Promise<MediaUploadOut> {
    const formData = new FormData();
    const filename = localUri.split("/").pop() ?? "photo.jpg";
    formData.append("file", {
      uri: localUri,
      type: mimeType,
      name: filename,
    } as unknown as Blob);
    return apiUploadFile<MediaUploadOut>(
      "/api/v1/reports/media/upload",
      formData
    );
  }

  async function deleteReport(reportId: string): Promise<void> {
    return apiDelete(`/api/v1/reports/${reportId}`);
  }

  return {
    data,
    loading,
    loadingMore,
    loadMore,
    submitReport,
    uploadPhoto,
    deleteReport,
    reload: () => load(1),
  };
}
