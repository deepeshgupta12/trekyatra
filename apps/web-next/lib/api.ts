const apiBase =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000")
    : "";

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase}/api/v1${path}`, {
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// WordPress content helpers — Step 16
// ---------------------------------------------------------------------------

export interface WPPost {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  status: string;
  post_type: string;
  link: string;
  date: string;
  meta: Record<string, string>;
}

export interface WPPostsResponse {
  posts: WPPost[];
  total: number;
  pages: number;
}

export async function fetchWPPost(
  slug: string,
  postType?: string,
): Promise<WPPost> {
  const qs = postType ? `?post_type=${postType}` : "";
  return apiFetch<WPPost>(`/wordpress/posts/${slug}${qs}`);
}

export async function fetchWPPosts(filters?: {
  post_type?: string;
  status?: string;
  per_page?: number;
  page?: number;
}): Promise<WPPostsResponse> {
  const params = filters
    ? "?" +
      new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).map(([k, v]) => [k, String(v)])
        )
      ).toString()
    : "";
  return apiFetch<WPPostsResponse>(`/wordpress/posts${params}`);
}
