import { create } from "zustand";
import { downloadTrekPages, removeTrekDownload, getDownloadedPages } from "../services/syncService";

interface OfflineState {
  downloadedSlugs: string[];
  isLoading: boolean;

  loadDownloaded: () => Promise<void>;
  download: (slug: string, accessToken: string) => Promise<void>;
  remove: (slug: string) => Promise<void>;
  isDownloaded: (slug: string) => boolean;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  downloadedSlugs: [],
  isLoading: false,

  loadDownloaded: async () => {
    const pages = await getDownloadedPages();
    // Extract unique root slugs (strip sub-page suffixes: /packing, /permits, /costs)
    const rootSlugs = [...new Set(pages.map((p) => p.slug.split("/")[0]))];
    set({ downloadedSlugs: rootSlugs });
  },

  download: async (slug, accessToken) => {
    set({ isLoading: true });
    try {
      await downloadTrekPages(slug, accessToken);
      const current = get().downloadedSlugs;
      if (!current.includes(slug)) {
        set({ downloadedSlugs: [...current, slug] });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  remove: async (slug) => {
    set({ isLoading: true });
    try {
      await removeTrekDownload(slug);
      set({ downloadedSlugs: get().downloadedSlugs.filter((s) => s !== slug) });
    } finally {
      set({ isLoading: false });
    }
  },

  isDownloaded: (slug) => get().downloadedSlugs.includes(slug),
}));
