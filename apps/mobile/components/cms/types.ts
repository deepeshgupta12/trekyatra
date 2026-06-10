export type Block =
  | { type: "paragraph"; content: string }
  | { type: "heading"; level: 2 | 3; content: string; id?: string }
  | { type: "image"; url: string; alt: string; caption?: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "callout"; variant: "warning" | "tip" | "info"; content: string }
  | { type: "faq"; items: Array<{ question: string; answer: string }> }
  | { type: "affiliate_card"; product_name: string; price: string; url: string; image: string }
  | { type: "html"; content: string };
