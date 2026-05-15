"""
Seed the 6 editorial/static CMS pages for TrekYatra.

Run from the DO App Platform Console (api component):
  python scripts/seed_static_cms_pages.py

Or locally:
  PYTHONPATH=services/api .venv/bin/python services/api/scripts/seed_static_cms_pages.py
"""
from __future__ import annotations

import sys
import os

# Allow running from project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.modules.cms.service import upsert_cms_page
from app.schemas.cms import CMSPageCreate

PAGES: list[dict] = [
    {
        "slug": "about",
        "page_type": "editorial",
        "title": "About TrekYatra — India's Editorial Trekking Platform",
        "seo_title": "About TrekYatra — India's Editorial Trekking Platform",
        "seo_description": "TrekYatra is India's most trusted trekking guide platform. We cover 250+ trails with trail-tested guides, verified permit information, and honest cost breakdowns.",
        "status": "published",
        "content_html": """<h2>Why we built TrekYatra</h2>
<p>TrekYatra started from a single frustration: every trekking resource online was either hopelessly outdated, vague about permits, or quietly promoting the operator who paid for placement. We spent three months getting permit status wrong, cost estimates wrong, and nearly booking a trek that was closed for the season. We built TrekYatra so no trekker has to waste those months.</p>
<p>Today, TrekYatra covers 250+ Indian treks across 32 states and regions, with guides written by people who have done the treks, permit information re-verified every 14 days, and cost breakdowns that include the things other sites conveniently leave out.</p>
<h2>Our editorial promises</h2>
<ul>
<li>Every guide is written from trail experience — not an AI summary of other blog posts</li>
<li>Every permit page is re-verified every 14 days using official forest department and state tourism board sources</li>
<li>Every cost estimate includes hidden costs: base-town travel, gear rental, tips for trek staff, and buffer days</li>
<li>Every comparison is built from real trail data, not operator marketing copy</li>
<li>Every page carries a visible updated date — we do not let guides silently go stale</li>
<li>No paid placement in editorial rankings — operators appear because of merit, not spend</li>
<li>Full affiliate disclosure on every gear and product recommendation</li>
</ul>
<h2>What we cover</h2>
<p>TrekYatra covers the full spectrum of Indian trekking: weekend Sahyadri hikes, Himalayan high-altitude expeditions, Western Ghats monsoon treks, Rajasthan desert walks, and Northeast forest trails. Our coverage spans Uttarakhand, Himachal Pradesh, Ladakh, Sikkim, Arunachal Pradesh, Karnataka, Maharashtra, and all major trekking states.</p>
<h2>Our team</h2>
<p>TrekYatra is built by a small team of trekkers, writers, and engineers based in Gurgaon, India. We are not a travel agency, tour operator, or booking platform. We earn through editorial affiliate commissions and digital products — never through paid operator placement.</p>
<h2>Contact us</h2>
<p>For editorial enquiries, corrections, or partnership discussions, write to us at <strong>hello@trekyatra.co.in</strong>. We respond within 2 business days.</p>""",
    },
    {
        "slug": "privacy-policy",
        "page_type": "editorial",
        "title": "Privacy Policy — TrekYatra",
        "seo_title": "Privacy Policy — TrekYatra",
        "seo_description": "Read TrekYatra's privacy policy — what personal data we collect, how we use it, and how you can control your data.",
        "status": "published",
        "content_html": """<p><strong>Last updated: May 2026.</strong> This policy explains what personal data TrekYatra collects, how we use it, and your rights under applicable Indian privacy law (DPDP Act 2023).</p>
<h2>1. What we collect</h2>
<ul>
<li><strong>Account data:</strong> email address, full name, display name when you register</li>
<li><strong>Usage data:</strong> pages visited, search queries (aggregated, anonymised)</li>
<li><strong>Saved content:</strong> bookmarks and trek alerts linked to your account</li>
<li><strong>Payment data:</strong> handled entirely by Razorpay or Stripe — we never store card details or bank information</li>
<li><strong>Newsletter:</strong> email address if you subscribe to the Trail Letter</li>
<li><strong>Enquiry data:</strong> name, email, phone, and trek interest when you contact an operator through our platform</li>
<li><strong>Trip planning data:</strong> trek preferences (region, duration, budget) when you use the Plan My Trek tool</li>
</ul>
<h2>2. How we use your data</h2>
<ul>
<li>To provide and improve TrekYatra's content, features, and personalised recommendations</li>
<li>To send the Trail Letter newsletter — only if you opted in; unsubscribe any time</li>
<li>To route trek enquiries to the appropriate operators on your behalf</li>
<li>To send transactional emails: purchase receipts, password reset links</li>
<li>To personalise trek recommendations based on your bookmarks and profile preferences</li>
<li>To process and deliver digital product purchases</li>
</ul>
<h2>3. What we do not do</h2>
<ul>
<li>We do not sell your personal data to any third party</li>
<li>We do not share your data with operators beyond what you explicitly submit in an enquiry form</li>
<li>We do not use your data for automated profiling that produces legal or similarly significant effects</li>
<li>We do not store payment card data — all payments are processed by PCI-compliant third parties</li>
</ul>
<h2>4. Cookies</h2>
<p>We use session cookies for authentication (HttpOnly, Secure). We use Google Analytics for aggregated traffic analytics. You can disable cookies in your browser, but this will prevent you from remaining logged in.</p>
<h2>5. Data retention</h2>
<p>Account data is retained while your account is active and for 90 days after deletion. Enquiry data is retained for 24 months. Payment records are retained as required by Indian tax law (7 years).</p>
<h2>6. Your rights</h2>
<p>Under the DPDP Act 2023, you have the right to: access your personal data, correct inaccurate data, erase your data, and withdraw consent for processing. Write to <strong>privacy@trekyatra.co.in</strong>. We respond within 30 days.</p>
<h2>7. Data security</h2>
<p>Passwords are hashed using PBKDF2-SHA256. All data in transit uses TLS 1.2+. Production database access is restricted to authenticated application instances only.</p>
<h2>8. Contact</h2>
<p><strong>privacy@trekyatra.co.in</strong> | TrekYatra, Gurgaon, Haryana, India</p>""",
    },
    {
        "slug": "terms-of-service",
        "page_type": "editorial",
        "title": "Terms & Conditions — TrekYatra",
        "seo_title": "Terms & Conditions — TrekYatra",
        "seo_description": "TrekYatra's terms and conditions — the rules for using our trekking guide platform, digital products, and content.",
        "status": "published",
        "content_html": """<p><strong>Last updated: May 2026.</strong> By using TrekYatra (trekyatra.co.in), you agree to these terms.</p>
<h2>1. Nature of the service</h2>
<p>TrekYatra is an editorial information platform. We provide trekking guides, permit information, cost estimates, and planning tools for Indian trekking destinations. <strong>We are not a trek booking platform, travel agent, or tour operator.</strong> We do not sell trek packages and do not hold booking deposits.</p>
<h2>2. Accuracy of information</h2>
<p>We re-verify permit information every 14 days and update cost estimates seasonally. However, trekking conditions, permit regulations, and fees can change without notice. <strong>Always verify critical information with official sources before you trek.</strong> TrekYatra is not liable for losses arising from reliance on outdated information.</p>
<h2>3. Safety disclaimer</h2>
<p>Trekking carries inherent risks. TrekYatra's guides are informational, not professional safety advice. You are responsible for your own safety decisions on the trail.</p>
<h2>4. User accounts</h2>
<p>You are responsible for keeping your account credentials secure. We reserve the right to terminate accounts that violate these terms or engage in fraudulent activity.</p>
<h2>5. Digital products</h2>
<p>Digital products are licensed for personal use only. You may not redistribute, resell, or share purchased digital products. Refunds are available within 24 hours of purchase if the file is defective.</p>
<h2>6. Affiliate links</h2>
<p>TrekYatra uses Amazon Associates and other affiliate programs. When you purchase through our links, we earn a commission at no extra cost to you. Read our full <a href="/affiliate-disclosure">Affiliate Disclosure</a>.</p>
<h2>7. Intellectual property</h2>
<p>All content on TrekYatra is copyright &copy; 2023&ndash;2026 TrekYatra. You may not reproduce or republish our content without written permission.</p>
<h2>8. Operator interactions</h2>
<p>When you contact an operator through TrekYatra, you are entering a direct relationship with that operator. TrekYatra is not a party to that transaction.</p>
<h2>9. Governing law</h2>
<p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Gurgaon, Haryana.</p>
<h2>10. Contact</h2>
<p><strong>legal@trekyatra.co.in</strong></p>""",
    },
    {
        "slug": "contact",
        "page_type": "editorial",
        "title": "Contact TrekYatra — Get in Touch",
        "seo_title": "Contact TrekYatra — Get in Touch",
        "seo_description": "Contact TrekYatra for editorial corrections, partnership enquiries, or product support. We respond within 2 business days.",
        "status": "published",
        "content_html": """<h2>How to reach us</h2>
<p>TrekYatra is a small editorial team based in Gurgaon, India. We are reachable by email — we do not maintain a phone support line.</p>
<h2>Editorial corrections</h2>
<p>Found an error in a permit fee, altitude, or trail distance? Write to <strong>editorial@trekyatra.co.in</strong> with the URL and the correction. We will investigate and update the guide within 3 business days.</p>
<h2>Partner and operator enquiries</h2>
<p>If you are a trek operator interested in being listed on TrekYatra's operator marketplace, write to <strong>partners@trekyatra.co.in</strong>. Include your company name, trek specialisation, regions covered, and GST number. We respond within 5 business days.</p>
<h2>Affiliate and content partnerships</h2>
<p>For gear brand collaborations, affiliate programme enquiries, or sponsored content discussions, write to <strong>partnerships@trekyatra.co.in</strong>. Note: we do not accept paid placement in editorial rankings or reviews.</p>
<h2>Technical support and account issues</h2>
<p>For issues with your account, digital product downloads, or subscription billing, write to <strong>support@trekyatra.co.in</strong>. Include your registered email address and a description of the issue. Response time: 1 business day.</p>
<h2>General enquiries</h2>
<p>For anything else: <strong>hello@trekyatra.co.in</strong></p>
<h2>Our office</h2>
<p>TrekYatra<br>Gurgaon, Haryana 122001<br>India</p>""",
    },
    {
        "slug": "affiliate-disclosure",
        "page_type": "editorial",
        "title": "Affiliate Disclosure — TrekYatra",
        "seo_title": "Affiliate Disclosure — TrekYatra",
        "seo_description": "TrekYatra's full affiliate disclosure — how we earn commissions, which programmes we participate in, and our editorial independence policy.",
        "status": "published",
        "content_html": """<p><strong>Last updated: May 2026.</strong> TrekYatra is committed to full transparency about how we earn revenue from our content.</p>
<h2>What is an affiliate link?</h2>
<p>When we link to products or services and you purchase through that link, we may earn a commission at no additional cost to you. The commission is paid by the merchant, not by you.</p>
<h2>Which affiliate programmes do we use?</h2>
<ul>
<li><strong>Amazon Associates India:</strong> We earn commissions on gear recommendations — backpacks, trekking poles, boots, headlamps, sleeping bags, and safety equipment — when you purchase through our links on Amazon.in. Associate ID: trekyatra21-21.</li>
<li><strong>Gear and equipment brands:</strong> We may have direct affiliate agreements with gear brands for products relevant to Indian trekking.</li>
<li><strong>Digital products:</strong> We sell our own digital products (planning templates, packing checklists, itinerary guides) directly on TrekYatra.</li>
</ul>
<h2>How does this affect our editorial independence?</h2>
<p>It does not. Our editorial policy is strict and unconditional:</p>
<ul>
<li>We <strong>never</strong> recommend a product because it pays us a higher commission</li>
<li>We <strong>never</strong> give an operator a higher ranking because they have a commercial arrangement with us</li>
<li>We <strong>always</strong> disclose affiliate relationships clearly on pages containing affiliate links</li>
<li>Our gear recommendations are based on trail-tested suitability for Indian conditions, not affiliate rates</li>
</ul>
<h2>How to identify affiliate links</h2>
<p>Links to Amazon and other affiliate programmes include tracking parameters (e.g., <code>?tag=trekyatra21-21</code>). If you prefer not to use affiliate links, you can search for the same product directly on the retailer's website.</p>
<h2>Questions</h2>
<p>Write to <strong>editorial@trekyatra.co.in</strong>.</p>""",
    },
    {
        "slug": "editorial-methodology",
        "page_type": "editorial",
        "title": "Editorial Methodology — How TrekYatra Researches and Writes",
        "seo_title": "Editorial Methodology — How TrekYatra Researches and Writes",
        "seo_description": "TrekYatra's editorial methodology — how we research trek guides, verify permits, handle AI-assisted content, and enforce our YMYL safety standards.",
        "status": "published",
        "content_html": """<h2>Our content philosophy</h2>
<p>TrekYatra produces content about a YMYL (Your Money or Your Life) topic — trekking safety and permit compliance. A wrong altitude, outdated permit requirement, or incorrect emergency contact could put a trekker in danger. We treat this responsibility seriously and apply editorial standards accordingly.</p>
<h2>How we research trek guides</h2>
<ol>
<li><strong>Primary sources first:</strong> Official forest department websites, state tourism board publications, mountaineering institute advisories, and NIMS/IMF bulletins</li>
<li><strong>Trail verification:</strong> Guides are cross-checked against recent trail reports from verified trekkers (2025&ndash;2026 season)</li>
<li><strong>Permit verification cycle:</strong> Every permit page is re-verified every 14 days against official sources</li>
<li><strong>Cost verification:</strong> Cost estimates are updated each season to reflect current transport fares, permit fees, and operator rates</li>
</ol>
<h2>AI-assisted content — our policy</h2>
<p>TrekYatra uses AI assistance in its content pipeline. We are transparent about this:</p>
<ul>
<li>AI is used to draft content structures and initial article text</li>
<li>All AI-drafted content goes through a fact-check stage that flags specific claims with confidence scores</li>
<li>Claims with confidence below 0.7 are flagged for mandatory human review before publication</li>
<li>Safety-critical content (altitude sickness, emergency contacts, permit requirements) is always human-verified before publication</li>
<li>Published dates and update dates reflect when human verification occurred</li>
</ul>
<h2>YMYL safety standards</h2>
<p>The following claim types always require human review before publication:</p>
<ul>
<li>Maximum altitude and acclimatisation requirements</li>
<li>Permit requirements and fees</li>
<li>Emergency contact numbers and evacuation routes</li>
<li>Medical advisories (AMS, HACE, HAPE risk zones)</li>
<li>Seasonal closures and weather windows</li>
</ul>
<h2>Corrections policy</h2>
<p>We correct factual errors promptly. Write to <strong>editorial@trekyatra.co.in</strong>. We acknowledge within 24 hours and publish a correction within 3 business days.</p>""",
    },
]


def seed_pages() -> None:
    from app.modules.cms import service as cms_service
    from app.schemas.cms import CMSPagePatch

    db = SessionLocal()
    try:
        created = 0
        updated = 0
        for page_data in PAGES:
            existing = cms_service.get_page_by_slug(db, page_data["slug"])

            if existing:
                patch = CMSPagePatch(
                    title=page_data["title"],
                    content_html=page_data["content_html"],
                    status=page_data["status"],
                    seo_title=page_data.get("seo_title"),
                    seo_description=page_data.get("seo_description"),
                )
                cms_service.update_page(db, page=existing, patch=patch)
                print(f"  UPDATED: /{page_data['slug']}")
                updated += 1
            else:
                payload = CMSPageCreate(
                    slug=page_data["slug"],
                    page_type=page_data["page_type"],
                    title=page_data["title"],
                    content_html=page_data["content_html"],
                    content_json=None,
                    status=page_data["status"],
                    seo_title=page_data.get("seo_title"),
                    seo_description=page_data.get("seo_description"),
                    hero_image_url=None,
                )
                cms_service.create_page(db, data=payload)
                print(f"  CREATED: /{page_data['slug']}")
                created += 1

        print(f"\nDone — {created} created, {updated} updated.")
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding editorial CMS pages...")
    seed_pages()
