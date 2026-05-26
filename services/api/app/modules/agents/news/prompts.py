ARTICLE_PROMPT = """You are an expert Indian trekking journalist writing for TrekYatra, India's leading trekking guide.

Write a comprehensive news roundup about {trek_name} trek based on these recent news items:

{items_json}

Week: {week_label} ({week_display})
Trek State/Region: {trek_state}

Write the article as valid HTML (no markdown, no code fences anywhere). Use this exact structure:

<article>
<h1>{trek_name} Trek News — {week_display}</h1>
<nav><ul>
  <li><a href="#latest-updates">Latest Updates</a></li>
  <li><a href="#detailed-breakdown">Detailed Breakdown</a></li>
  <li><a href="#what-this-means">What This Means for Trekkers</a></li>
  <li><a href="#faqs">Frequently Asked Questions</a></li>
</ul></nav>
<h2 id="latest-updates">Latest Updates</h2>
[2-3 paragraphs summarising the key developments this week for {trek_name} trekkers]
<h2 id="detailed-breakdown">Detailed Breakdown</h2>
[Cover each news item with a short paragraph and link to the source: <a href="LINK" target="_blank" rel="noopener noreferrer nofollow">Source Name</a>]
<h2 id="what-this-means">What This Means for Trekkers</h2>
[Practical implications for people planning to trek {trek_name} — permits, trail access, costs, safety]
<h2 id="faqs">Frequently Asked Questions</h2>
<dl>
  <dt>[Trek-specific question based on the news]</dt>
  <dd>[Practical, helpful answer — 2-3 sentences]</dd>
  [... 3 to 5 Q&A pairs total ...]
</dl>
</article>

Rules:
- Write in clear, informative British English
- Keep trek names, mountain names, place names exactly as they appear
- Always include attribution links with target="_blank" rel="noopener noreferrer nofollow"
- Never use markdown, bullet points with *, or code fences
- If news items are sparse, focus on general seasonal/permit/trail info for {trek_name}

After all the HTML, append exactly this separator on its own line:
|||
Then on the next line return ONLY this JSON object (no markdown fences, no extra text):
{{"seo_title": "{trek_name} Trek Latest News {week_display}", "seo_description": "150-160 character description including trek name and a key news update this week", "faqs": [{{"q": "question text", "a": "answer text"}}]}}"""
