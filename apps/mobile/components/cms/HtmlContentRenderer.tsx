import React from "react";
import { useWindowDimensions, View } from "react-native";
import RenderHTML from "react-native-render-html";
import { useTheme } from "@/hooks/useTheme";
import { TableBlock } from "./blocks/TableBlock";

interface Props {
  html: string;
}

// Strip HTML tags and decode basic entities
function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8377;/g, "₹")
    .replace(/&rarr;/g, "→")
    .trim();
}

function extractCells(trHtml: string, tag: "th" | "td"): string[] {
  const cells: string[] = [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  let m;
  while ((m = re.exec(trHtml)) !== null) {
    cells.push(stripTags(m[1]));
  }
  return cells;
}

function parseTableHtml(tableHtml: string): { headers: string[]; rows: string[][] } {
  let headers: string[] = [];
  const rows: string[][] = [];

  // Try <thead> first
  const theadMatch = tableHtml.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
  if (theadMatch) {
    const trMatch = theadMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
    if (trMatch) {
      headers = extractCells(trMatch[1], "th");
      if (!headers.length) headers = extractCells(trMatch[1], "td");
    }
  }

  // Get body rows from <tbody> or full table if no <tbody>
  const bodyHtml =
    tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)?.[1] ?? tableHtml;
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = trRegex.exec(bodyHtml)) !== null) {
    const hasTh = /<th[^>]*>/i.test(trMatch[1]);
    if (hasTh && headers.length === 0) {
      headers = extractCells(trMatch[1], "th");
    } else {
      const row = extractCells(trMatch[1], "td");
      if (row.length > 0) rows.push(row);
    }
  }

  return { headers, rows };
}

type Segment = { type: "html"; content: string } | { type: "table"; headers: string[]; rows: string[][] };

function splitByTables(html: string): Segment[] {
  const segments: Segment[] = [];
  const tableRegex = /<table[\s\S]*?<\/table>/gi;
  let lastIndex = 0;
  let match;

  while ((match = tableRegex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      const before = html.slice(lastIndex, match.index).trim();
      if (before) segments.push({ type: "html", content: before });
    }
    const { headers, rows } = parseTableHtml(match[0]);
    if (rows.length > 0 || headers.length > 0) {
      segments.push({ type: "table", headers, rows });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    const remaining = html.slice(lastIndex).trim();
    if (remaining) segments.push({ type: "html", content: remaining });
  }

  return segments;
}

export function HtmlContentRenderer({ html }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const tagsStyles = {
    h1: {
      fontFamily: "PlayfairDisplay_700Bold",
      fontSize: 24,
      color: colors.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    h2: {
      fontFamily: "PlayfairDisplay_700Bold",
      fontSize: 20,
      color: colors.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    h3: {
      fontFamily: "PlayfairDisplay_600SemiBold",
      fontSize: 18,
      color: colors.textPrimary,
      marginTop: 12,
      marginBottom: 6,
    },
    h4: {
      fontFamily: "PlayfairDisplay_600SemiBold",
      fontSize: 16,
      color: colors.textPrimary,
      marginTop: 12,
      marginBottom: 4,
    },
    p: {
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      lineHeight: 24,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    li: {
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      lineHeight: 24,
      color: colors.textSecondary,
    },
    strong: { color: colors.textPrimary },
    a: { color: colors.accent, textDecorationLine: "underline" as const },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
      paddingLeft: 12,
      marginLeft: 0,
      marginVertical: 8,
      fontStyle: "italic" as const,
      color: colors.textSecondary,
    },
  };

  const segments = splitByTables(html);

  // Fast path: no tables in this content
  if (segments.length === 1 && segments[0].type === "html") {
    return (
      <View style={{ paddingHorizontal: 16 }}>
        <RenderHTML
          contentWidth={width - 32}
          source={{ html }}
          tagsStyles={tagsStyles}
          enableExperimentalMarginCollapsing
        />
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {segments.map((seg, i) => {
        if (seg.type === "html") {
          return (
            <RenderHTML
              key={i}
              contentWidth={width - 32}
              source={{ html: seg.content }}
              tagsStyles={tagsStyles}
              enableExperimentalMarginCollapsing
            />
          );
        }
        return (
          <TableBlock key={i} headers={seg.headers} rows={seg.rows} />
        );
      })}
    </View>
  );
}
