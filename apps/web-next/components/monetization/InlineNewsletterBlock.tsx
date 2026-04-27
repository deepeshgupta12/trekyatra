import NewsletterCapture from "./NewsletterCapture";

interface Props {
  sourcePage: string;
  leadMagnet?: string;
}

export default function InlineNewsletterBlock({ sourcePage, leadMagnet }: Props) {
  return (
    <div className="not-prose my-8">
      <NewsletterCapture
        sourcePage={sourcePage}
        leadMagnet={leadMagnet}
        title="Get trek updates in your inbox"
        subtitle="Seasonal alerts, permit changes, and new trek guides — no spam."
      />
    </div>
  );
}
