import UpdatedBadge from "./UpdatedBadge";

interface Props {
  author?: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

export default function AuthorBlock({ author = "TrekYatra Editorial", publishedAt, updatedAt }: Props) {
  return (
    <div className="flex items-center gap-3 py-4 border-t border-border mt-2">
      <div className="h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center text-accent font-semibold text-sm flex-shrink-0">
        {author.charAt(0)}
      </div>
      <div>
        <div className="text-sm font-medium text-foreground">{author}</div>
        <UpdatedBadge dateStr={updatedAt ?? publishedAt} className="mt-0.5" />
      </div>
    </div>
  );
}
