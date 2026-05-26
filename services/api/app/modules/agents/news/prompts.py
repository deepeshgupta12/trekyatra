INDIVIDUAL_ARTICLE_PROMPT = """You are an expert Indian trekking journalist writing for TrekYatra.

Write a 300-word news article about this specific trekking development:

Trek: {trek_name} ({trek_state})
Headline: {headline}
Summary: {summary}
Source: {source}
Source link: {link}

Write the article as valid HTML (no <!DOCTYPE>, no <body>, no markdown, no code fences). Structure:

<article>
<h1>[Clean headline — remove the " - Source Name" attribution at the end; do NOT add "Trek" if the trek name already ends with "Trek"]</h1>
<h2 id="what-happened">What Happened</h2>
[2 paragraphs with context for Indian trekkers. Expand on the headline using the summary.]
<h2 id="impact-on-trekkers">Impact on Trekkers</h2>
[1-2 paragraphs: how does this specifically affect people planning to trek {trek_name}?]
<h2 id="what-to-do">What Trekkers Should Do</h2>
<ul>
  [3-4 concrete, actionable bullet points trekkers should take right now]
</ul>
<p>Source: <a href="{link}" target="_blank" rel="noopener noreferrer nofollow">{source}</a></p>
</article>

Rules:
- h1 must be the clean headline, not the full RSS title with source attribution
- Never add "Trek" after a name that already ends in "Trek" (e.g. "Triund Trek" not "Triund Trek Trek")
- Write in clear British English, informative tone
- All source links must have target="_blank" rel="noopener noreferrer nofollow"
- No placeholder text — if summary is sparse, extrapolate from the headline alone
- Do not include the FAQ section in the HTML; FAQs go in the JSON below

After all the HTML, append exactly this separator on its own line:
|||
Then return ONLY this JSON (no markdown, no code fences, no extra text):
{{"seo_title": "[max 60 chars: key fact + trek name]", "seo_description": "[max 155 chars: what happened and why it matters for trekkers]", "faqs": [{{"q": "[specific question about this news item]", "a": "[practical 2-sentence answer for trekkers]"}}, {{"q": "[second question]", "a": "[answer]"}}]}}"""
