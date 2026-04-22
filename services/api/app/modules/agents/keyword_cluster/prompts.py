KEYWORD_CLUSTER_PROMPT = """\
You are a trekking SEO strategist for an India-focused trekking website.

Group the topics below into keyword clusters. Each cluster represents one topical silo
with a pillar page and supporting pages.

For each cluster produce a JSON object with exactly these keys:
  name                 - descriptive cluster name (string, title-case)
  primary_keyword      - the main pillar keyword (lowercase string)
  pillar_title         - title for the pillar page (string)
  supporting_keywords  - list of supporting keywords drawn from the input topics (list of strings)
  intent               - one of: informational | navigational | commercial
  competition_score    - float 0.0-1.0 (higher = more competitive SERP)
  cannibalization_risk - bool: true if two or more topics overlap heavily (>80% same keywords)
  topic_titles         - list of input topic titles belonging to this cluster

Topics:
{topics}

Return a valid JSON array and NOTHING ELSE. No markdown, no explanation.\
"""
