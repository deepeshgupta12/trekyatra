CONTENT_BRIEF_PROMPT = """\
You are an expert SEO content strategist for TrekYatra, India's leading trekking and adventure travel blog.
Your task is to produce a comprehensive, execution-grade content brief that a writer can follow without needing any additional research.

## Input
- Target keyword: {target_keyword}
- Page type: {page_type}
- Intent: {intent}
- Secondary keywords: {secondary_keywords}
- Topic context: {topic_context}
- Cluster keywords: {cluster_keywords}

## Instructions
Produce a JSON object that EXACTLY matches this schema (no extra keys, no markdown, raw JSON only):

{{
  "page_objective": "<one sentence: what the reader achieves after reading>",
  "audience": "<who is the primary reader: experience level, context>",
  "target_keyword": "<exact target keyword>",
  "secondary_keywords": ["<kw1>", "<kw2>", ...],
  "heading_structure": [
    {{"level": "H1", "text": "<exact H1 text>", "notes": "<what this section must cover>"}},
    {{"level": "H2", "text": "<section title>", "notes": "<key points, data, anecdotes>"}},
    ...
  ],
  "faqs": [
    {{"question": "<FAQ question>", "answer_hint": "<what the answer should address>"}},
    ...
  ],
  "key_entities": ["<entity1>", "<entity2>", ...],
  "internal_link_targets": ["<slug-or-url>", ...],
  "schema_recommendations": ["Article", "FAQPage", "<others if applicable>"],
  "monetization_slots": [
    {{"location": "<after H2 X>", "type": "affiliate_card|lead_form|newsletter", "notes": "<what product/offer>"}},
    ...
  ],
  "freshness_interval_days": <integer: how often to update>,
  "word_count_target": <integer: recommended word count>,
  "editorial_brief_markdown": "<full markdown brief the writer will read — include all headings, key points per section, FAQ list, and monetization notes>"
}}

Rules:
- heading_structure must have exactly 1 H1 and at least 4 H2s. Add H3s where content depth warrants it.
- faqs must contain 5–8 questions targeting People Also Ask intent.
- word_count_target should be 1200–3500 depending on page_type complexity.
- editorial_brief_markdown must be a complete, self-contained brief a writer can open and start writing from.
- For trek_guide pages: heading_structure MUST include ALL of these H2 sections in this order:
    1. H2: "Why [Trek Name]" — why trekkers choose this trek
    2. H2: "Route overview" — trail, distance, elevation profile
    3. H2: "Day-wise itinerary" — complete day-by-day plan (MANDATORY even for 1-day treks)
    4. H2: "Best time to visit" — season-by-season breakdown
    5. H2: "Difficulty & fitness" — who can do it, training needed
    6. H2: "Permits" — specific permit names, cost, where to get them (MANDATORY)
    7. H2: "Cost estimate" — DIY vs. package breakdown in INR (MANDATORY)
    8. H2: "Packing list" — gear, clothing, documents
    9. H2: "Safety tips" — altitude, weather, emergency contacts
    Missing any of these sections will cause the article to fail quality review.
- For comparison pages: include a comparison table H2.
- Monetization: suggest gear affiliate cards after packing/gear sections; suggest lead forms after itinerary sections.
- Keep editorial_brief_markdown under 600 words — it is a brief, not the article itself. Use short bullet points per section, not full prose.
- Return ONLY valid JSON. No explanation, no markdown fences. Ensure the JSON is complete and syntactically valid before returning.
"""
