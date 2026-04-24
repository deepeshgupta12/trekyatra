interface Props {
  schemas: (object | null | undefined)[];
}

/**
 * Renders one <script type="application/ld+json"> per schema object.
 * Null/undefined entries are skipped (callers can pass conditional schemas directly).
 * Must be rendered inside <head> via Next.js metadata or inside the page Server Component.
 */
export default function SchemaInjector({ schemas }: Props) {
  const valid = schemas.filter(Boolean) as object[];
  if (!valid.length) return null;
  return (
    <>
      {valid.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
