import React from "react";
import { View, Text } from "react-native";
import type { Block } from "./types";
import { ParagraphBlock } from "./blocks/ParagraphBlock";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { ListBlock } from "./blocks/ListBlock";
import { TableBlock } from "./blocks/TableBlock";
import { CalloutBlock } from "./blocks/CalloutBlock";
import { FAQBlock } from "./blocks/FAQBlock";
import { AffiliateCardBlock } from "./blocks/AffiliateCardBlock";

interface Props {
  bodyJson: Block[] | null;
}

export function CMSContentRenderer({ bodyJson }: Props) {
  if (!bodyJson || bodyJson.length === 0) {
    return (
      <View className="py-8 items-center">
        <Text className="text-gray-400 text-sm">No content available.</Text>
      </View>
    );
  }

  return (
    <View className="px-4">
      {bodyJson.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return <ParagraphBlock key={i} content={block.content} />;
          case "heading":
            return <HeadingBlock key={i} level={block.level} content={block.content} id={block.id} />;
          case "image":
            return <ImageBlock key={i} url={block.url} alt={block.alt} caption={block.caption} />;
          case "list":
            return <ListBlock key={i} ordered={block.ordered} items={block.items} />;
          case "table":
            return <TableBlock key={i} headers={block.headers} rows={block.rows} />;
          case "callout":
            return <CalloutBlock key={i} variant={block.variant} content={block.content} />;
          case "faq":
            return <FAQBlock key={i} items={block.items} />;
          case "affiliate_card":
            return (
              <AffiliateCardBlock
                key={i}
                product_name={block.product_name}
                price={block.price}
                url={block.url}
                image={block.image}
              />
            );
          case "html":
            // HTML blocks rendered as plain text — WebView not available in all builds
            return (
              <Text key={i} className="text-sm text-gray-500 italic my-2">
                [Rich content — open in browser for full view]
              </Text>
            );
          default:
            return null;
        }
      })}
    </View>
  );
}
