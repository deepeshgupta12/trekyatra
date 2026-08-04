"""Rich hub content used by the hub agents to generate the structured `content_json.hub` written into
cms_pages. Mirrors the frontend fallback content (apps/web-next/lib/season-content.ts,
category-content.ts, regions.ts REGION_WHY) so a generated page matches or exceeds the code fallback.
Human prose, no dashes or hyphens. Once generated, editors own the content in /admin/cms.

Contract (content_json.hub), rendered dynamically by the frontend hub pages:
  seasons  -> intro, overview, why, bestRegions[], monthTable[], prepare[], packing[], weather, faqs[]
  clusters -> intro, overview, why, bestRegions[], prepare[], faqs[]
  regions  -> why, overview, faqs[]   (region page also reads content_json.faqs)
"""
from __future__ import annotations

from typing import Any

# ── Seasons ──────────────────────────────────────────────────────────────────
SEASON_CONTENT: dict[str, dict[str, Any]] = {
    "spring": {
        "months_label": "March to April", "tagline": "Rhododendron season in the lower Himalaya",
        "intro": "Spring is the season the Himalaya wakes up. Through March and April the snow pulls back from the lower ridgelines, the oak and rhododendron forests of Uttarakhand, Himachal and the North East burst into red and pink flower, and the trails firm up into some of the most colourful walking of the whole year.",
        "overview": "It is also one of the quietest windows on the calendar. The winter snow crowds have gone home and the big summer rush has not yet arrived, so popular ridgelines feel almost private. Days are mild in the forest, nights are cold higher up, and the light through the flowering canopy is something photographers plan a whole year around.",
        "why": "Spring sits in the sweet spot between the deep snow of winter and the crowds of summer. Lower and mid altitude trails are clear of snow and stable underfoot, the forests are in full bloom, and the weather is gentle enough for relaxed days. Passes above roughly 4,000 metres can still hold snow, so spring rewards forest and ridge treks rather than big glacier crossings.",
        "bestRegions": [
            {"name": "Uttarakhand", "slug": "uttarakhand", "note": "Brahmatal and Ali Bedni Bugyal for ridgelines lined with rhododendron."},
            {"name": "Sikkim and North East", "slug": "sikkim", "note": "Sandakphu and the Goecha La approach for Himalayan bloom."},
            {"name": "Himachal Pradesh", "slug": "himachal", "note": "Lower Kullu and Dhauladhar forest trails clearing of snow."},
        ],
        "monthTable": [
            {"month": "March", "conditions": "Rhododendron begins in the lower forests while high passes stay under snow."},
            {"month": "April", "conditions": "Peak bloom, drying trails and warm days make this the best spring window."},
        ],
        "prepare": [
            "Build a base of cardio fitness with regular walking or jogging four to six weeks ahead",
            "Book early for popular rhododendron ridgelines, which fill fast on weekends",
            "Carry traction for any high sections that still hold snow",
            "Plan for warm days and cold nights by packing a proper layering system",
        ],
        "packing": [
            "Light insulating layers for cold mornings and nights",
            "A packable rain shell for the odd spring shower",
            "Strong sun protection because the light is intense at altitude",
            "Trekking poles for lingering snow on the higher sections",
        ],
        "weather": "Mild days of 10 to 18 degrees in the forests, cold nights higher up, and residual snow on passes above 4,000 metres.",
        "prep": "Some high passes stay under snow into April, so check current conditions and carry traction for the higher routes.",
        "beginnerNote": "Spring is an excellent first season because the forest trails are clear of snow and the grade stays gentle.",
    },
    "summer": {
        "months_label": "May to June", "tagline": "Alpine meadows and the high Himalaya opening up",
        "intro": "Summer is when the high Himalaya finally opens. As the snowline retreats through May and June, the high meadows turn a deep emerald, and the great alpine lake and pass routes of Kashmir, Himachal and Ladakh become walkable again. Long daylight makes for slow, unhurried days on the trail.",
        "overview": "This is the flagship trekking window of the year and it draws trekkers from across the country and the world. Schools and offices are on break, the meadows are at their greenest, and the classic routes are all in condition at once. It rewards a little planning, because the best homestays, guides and permits get booked out well in advance.",
        "why": "With the snowline retreating fast and the whole country on holiday, summer is peak Himalayan trekking season. It is the time for the marquee high routes, from the Kashmir Great Lakes to Hampta Pass, Beas Kund and the early Valley of Flowers, when the meadows bloom and the high camps are clear of snow.",
        "bestRegions": [
            {"name": "Kashmir", "slug": "kashmir", "note": "The Great Lakes trek at its turquoise and meadow best."},
            {"name": "Himachal Pradesh", "slug": "himachal", "note": "Hampta Pass, Bhrigu Lake and Beas Kund all open up."},
            {"name": "Ladakh", "slug": "ladakh", "note": "Markha Valley and the high desert routes become accessible."},
        ],
        "monthTable": [
            {"month": "May", "conditions": "Snow melts fast, meadows begin to green and many routes stay quiet."},
            {"month": "June", "conditions": "Peak meadow season and the warmest weather before the monsoon arrives."},
        ],
        "prepare": [
            "Book permits, homestays and guides early because this is the busiest season",
            "Arrive with solid cardio fitness for long days and real altitude",
            "Give yourself acclimatisation days on the higher lake and pass routes",
            "Carry two litres of water capacity for dry, sunny days",
        ],
        "packing": [
            "High factor sunscreen, lip balm and UV sunglasses for intense glare",
            "Layers for warm days and cold high altitude nights",
            "A light rain shell for the first showers by late June",
            "A wide brimmed hat and a buff for sun on open meadows",
        ],
        "weather": "Warm days of 15 to 25 degrees at base, cold nights at altitude, very strong sun, and the first showers by late June.",
        "prep": "This is the busiest window, so book ahead, hydrate well and prioritise sun protection on the open meadows.",
        "beginnerNote": "Summer suits beginners with reasonable fitness, though meadow treks still climb high enough that acclimatisation matters.",
    },
    "monsoon": {
        "months_label": "July to September", "tagline": "Waterfalls, emerald forts and rain shadow deserts",
        "intro": "When the monsoon closes most of the Himalaya, the Western Ghats come alive. Through July, August and September the Sahyadri forts of Maharashtra run with waterfalls, the forests of Karnataka and Coorg turn a brilliant green, and, tucked away in the rain shadow of the main range, Ladakh and Spiti stay dry and walkable.",
        "overview": "Monsoon trekking is a completely different country. Instead of snow peaks you get misty ramparts, roaring waterfalls and cloud pouring over basalt cliffs. It calls for good rain gear and respect for fast rising water, but it delivers some of the most atmospheric and affordable trekking of the year, all within a few hours of Mumbai, Pune and Bengaluru.",
        "why": "The high Himalaya is prone to landslides and leeches in the rains, but the Sahyadris are at their dramatic best, and the rain shadow deserts of Ladakh offer the only reliable high altitude trekking of the season. It is the time to trade snow for green and to walk historic fort trails in the cloud.",
        "bestRegions": [
            {"name": "Maharashtra Sahyadris", "slug": "maharashtra", "note": "Fort treks and waterfalls at their full monsoon peak."},
            {"name": "Karnataka", "slug": "karnataka", "note": "Kudremukh and the Western Ghats in deep green."},
            {"name": "Ladakh", "slug": "ladakh", "note": "Rain shadow high desert routes stay dry and open."},
        ],
        "monthTable": [
            {"month": "July", "conditions": "Peak monsoon in the Ghats with full waterfalls, heavy rain and leeches out."},
            {"month": "August", "conditions": "Deep green everywhere, with slick basalt and active leeches in the Sahyadris."},
            {"month": "September", "conditions": "The rain tapers off and the Sahyadris are at their greenest and finest."},
        ],
        "prepare": [
            "Skip the main Himalaya during the rains and choose the Ghats or the rain shadow",
            "Waterproof everything inside your pack with a liner and dry bags",
            "Carry leech protection such as salt, tobacco or leech socks",
            "Never attempt to cross a swollen stream in spate",
        ],
        "packing": [
            "A genuinely waterproof jacket and pack cover, not just water resistant",
            "Quick drying clothing and a spare set sealed in a dry bag",
            "Leech protection for the Western Ghats",
            "Shoes with aggressive grip for wet, slippery basalt",
        ],
        "weather": "Heavy, persistent rain and leeches in the Western Ghats, and dry, cool, sunny weather in rain shadow Ladakh and Spiti.",
        "prep": "Avoid the main Himalaya for landslide and leech reasons, and in the Ghats focus on waterproofing, grip and stream safety.",
        "beginnerNote": "The Sahyadris are beginner friendly in the monsoon because the fort treks are short and low, though wet rock and rising water need respect.",
    },
    "autumn": {
        "months_label": "October to November", "tagline": "The clearest Himalayan skies of the year",
        "intro": "Autumn is the season the mountains show off. The monsoon has scrubbed the sky clean, so the air is crystal clear and the peaks stand out razor sharp against a deep blue. Through October and November the weather turns stable and dry, and the trails harden into perfect walking.",
        "overview": "This is the classic window for the big high routes and the great base camp approaches. Rivers have dropped, the light is gorgeous, and the giants are at their cleanest before winter closes in. Early October is warm and settled, while November turns colder and quieter as the first snow dusts the high passes.",
        "why": "After the monsoon the visibility is simply unmatched, and this is when the biggest peaks stand cleanest against the sky. Trails are dry, the weather is stable, and it is the finest time for high passes, ridge walks and the famous base camp treks before the cold sets in.",
        "bestRegions": [
            {"name": "Uttarakhand", "slug": "uttarakhand", "note": "Kuari Pass and Kedarkantha for wide, clear panoramas."},
            {"name": "Sikkim and North East", "slug": "sikkim", "note": "Goecha La for the cleanest Kanchenjunga views of the year."},
            {"name": "Nepal Himalaya", "slug": "nepal", "note": "Everest and Annapurna base camp routes at their prime."},
        ],
        "monthTable": [
            {"month": "October", "conditions": "Peak clarity and stable weather deliver the finest high Himalaya trekking."},
            {"month": "November", "conditions": "Colder and quieter, with the first winter snow arriving on high passes."},
        ],
        "prepare": [
            "Start walking early each day because the daylight shortens through November",
            "Carry a warm sleeping system for nights that drop below freezing at altitude",
            "Book base camp routes ahead, as October is a popular window",
            "Pack a headlamp for early starts and short evenings",
        ],
        "packing": [
            "A warm down or synthetic jacket for freezing nights at altitude",
            "Layered insulation because days are mild but nights are cold",
            "A headlamp for shorter days through November",
            "Sun protection for bright, high altitude afternoons",
        ],
        "weather": "Crisp, dry and exceptionally clear, with pleasant days, nights below freezing at altitude, and early snow on high passes by late November.",
        "prep": "Daylight shortens quickly, so start early and carry a proper sleeping system for the cold nights above 3,500 metres.",
        "beginnerNote": "Autumn is ideal for beginners because the trails are dry and stable and the famous first timer routes are at their best.",
    },
    "winter": {
        "months_label": "December to February", "tagline": "Snow treks and frozen trails",
        "intro": "Winter turns the lower ridgelines of Uttarakhand and Himachal white, and with them come India's most loved snow treks. Powder covered pine forests, frozen meadows and glowing sunrise summits make this the season that turns curious first timers into lifelong trekkers.",
        "overview": "The beauty of the Indian winter is that you can walk on snow without technical mountaineering. Summits like Kedarkantha, Brahmatal and Nag Tibba give you the full alpine experience, a pristine white campsite and a wide snow panorama, with nothing more than good gear and a guide. December is the gentle start, January is the deep cold, and February pairs deep snow with brighter, clearer spells.",
        "why": "Winter is snow trek season. Accessible summits offer the full alpine experience of pristine white campsites and wide snow panoramas without any technical climbing. It is the most photogenic and the most beginner friendly way to walk on snow in the country.",
        "bestRegions": [
            {"name": "Uttarakhand", "slug": "uttarakhand", "note": "Kedarkantha, Brahmatal and Dayara Bugyal are the classic snow treks."},
            {"name": "Himachal Pradesh", "slug": "himachal", "note": "Kheerganga and Prashar Lake under fresh snow."},
            {"name": "Kashmir", "slug": "kashmir", "note": "Winter meadows and the Gulmarg area snowscape."},
        ],
        "monthTable": [
            {"month": "December", "conditions": "Early powdery snow makes this the gentlest month for first time snow trekkers."},
            {"month": "January", "conditions": "Deep winter brings the heaviest snow and the coldest nights."},
            {"month": "February", "conditions": "Deep snow pairs with clearer, brighter spells and stunning summits."},
        ],
        "prepare": [
            "Rent or buy microspikes and gaiters before the trek for snow and ice",
            "Carry winter grade insulation and an insulated sleeping bag",
            "Trek December to February and pick December if you are new to snow",
            "Go with a registered guide and never head above the snowline alone",
        ],
        "packing": [
            "Heavy insulation including a down jacket, thermals and an insulated sleeping bag",
            "Microspikes and gaiters for snow and ice underfoot",
            "A waterproof outer shell and insulated waterproof gloves",
            "UV sunglasses because snow glare is severe",
        ],
        "weather": "Snow on the trails, short days, and nights of minus 5 to minus 15 degrees at altitude, with bright clear days between snowfalls.",
        "prep": "Microspikes and gaiters are essential, watch for frostbite and altitude sickness, and never trek solo above the snowline.",
        "beginnerNote": "This is the best beginner snow season, and Kedarkantha and Brahmatal are made for a first snow trek with the right guide and gear.",
    },
}

# ── Trek categories ──────────────────────────────────────────────────────────
CATEGORY_CONTENT: dict[str, dict[str, Any]] = {
    "beginner-friendly-treks": {
        "intro": "Beginner friendly treks are the gateway to the mountains. They keep the gradients gentle, the days short and the altitude moderate, and they run on well marked trails, so a first timer can experience a high camp and a summit morning without any technical risk.",
        "overview": "A good first trek is less about grit and more about the right choice. Pick a route that stays within your fitness, walk with people who know the trail, and you come home hungry for the next one. These are the treks we hand to friends who have never slept in a tent, and almost none of them stop at one.",
        "why": "A good first trek builds confidence and fitness while keeping the risk low. These routes hold to manageable altitude, cover sensible daily distances and follow established trails with a mature guiding network, so you can focus on the experience rather than the exposure.",
        "prepare": [
            "Choose a trek of four to five days with a highest point under roughly 4,000 metres",
            "Build a base of cardio fitness with walking, stairs and jogging for a month beforehand",
            "Walk your first few treks with a registered guide or an organised group",
            "Break in your trekking shoes before the trek so you avoid blisters",
        ],
        "bestRegions": [
            {"name": "Uttarakhand", "slug": "uttarakhand", "note": "Kedarkantha and Brahmatal are purpose built first snow treks."},
            {"name": "Himachal Pradesh", "slug": "himachal", "note": "Triund and Prashar Lake make easy, scenic first outings."},
            {"name": "Maharashtra Sahyadris", "slug": "maharashtra", "note": "Short fort treks are perfect for a low altitude start."},
        ],
        "beginnerNote": "These are the treks we recommend for a first timer, chosen for a gentle grade and low altitude.",
    },
    "weekend-treks": {
        "intro": "Weekend treks pack a real mountain experience into two or three days. They are the short routes you can reach from a city on Friday night and be back from by Monday morning, without spending any of your precious leave.",
        "overview": "You do not need a week off to get into the hills. Weekend routes are built around quick access and compact itineraries, which makes them ideal for regular escapes, for building fitness between bigger expeditions, and for talking a friend into their very first trek.",
        "why": "Not every trek needs a week. Weekend routes are built around quick access and compact itineraries, which makes them ideal for regular escapes, fitness between bigger treks, and easy introductions for new trekkers.",
        "prepare": [
            "Check overnight bus and train timings so you get the most trail time",
            "Start early to beat the heat and the afternoon weather",
            "Carry rain gear in the Western Ghats even outside the monsoon",
            "Confirm any fort or forest permits before you set out",
        ],
        "bestRegions": [
            {"name": "Maharashtra Sahyadris", "slug": "maharashtra", "note": "The weekend capital, with dozens of fort routes near Mumbai and Pune."},
            {"name": "Karnataka", "slug": "karnataka", "note": "Western Ghats trails within a weekend of Bengaluru."},
            {"name": "Himachal Pradesh", "slug": "himachal", "note": "Triund and the lower Kullu ridgelines for a quick Himalayan hit."},
        ],
        "beginnerNote": "Most weekend treks are short and low, which makes them excellent for beginners too.",
    },
    "high-altitude-treks": {
        "intro": "High altitude treks climb past 4,000 metres into a world of big passes, thin air and the grandest Himalayan panoramas. They are serious routes that ask for fitness, careful acclimatisation and real respect for the mountains.",
        "overview": "This is where the Himalaya shows its full scale, on glaciated passes, high desert plateaus and summit views that make every hard step worthwhile. These routes reward experienced trekkers who have built both the fitness and the acclimatisation discipline to handle altitude safely, and they punish anyone who rushes.",
        "why": "This is where the Himalaya shows its full scale, on glaciated passes, high desert plateaus and summit views that repay the effort. High routes reward experienced trekkers who have built the fitness and the acclimatisation habits to handle altitude safely.",
        "prepare": [
            "Build acclimatisation and rest days into the plan and climb high but sleep low",
            "Learn the symptoms of altitude sickness and never ignore them",
            "Talk to a doctor about medication before the trek if you are prone to altitude sickness",
            "Arrive with strong cardio fitness because these routes are unforgiving",
        ],
        "bestRegions": [
            {"name": "Ladakh", "slug": "ladakh", "note": "Markha Valley and Stok Kangri sit above 3,500 metres at every step."},
            {"name": "Uttarakhand", "slug": "uttarakhand", "note": "Roopkund and Kuari Pass are high, classic Garhwal routes."},
            {"name": "Nepal Himalaya", "slug": "nepal", "note": "Everest and Annapurna base camp trails at serious altitude."},
        ],
        "beginnerNote": "These are not for a first trek. Build up through lower routes first, then attempt altitude once you are confident with acclimatisation.",
    },
    "lake-treks": {
        "intro": "Lake treks are built around the high alpine lakes of the Himalaya, pools of glacial blue and green set against snow peaks, with some of the most photogenic campsites in the country.",
        "overview": "Few sights match a string of alpine lakes catching the peaks above them. From the Kashmir Great Lakes to Roopkund and Bhrigu Lake, these treks pair dramatic scenery with the calm rhythm of moving from one lake basin to the next. Most sit high, so they read best from summer through autumn once the ice has gone.",
        "why": "Few sights match a chain of alpine lakes reflecting the peaks above them. These treks combine dramatic scenery with the meditative rhythm of walking from one lake basin to the next.",
        "prepare": [
            "Trek from summer through autumn once the lakes have thawed",
            "Camp well back from the shoreline to protect the fragile lake ecology",
            "Carry a filter or purification for glacial melt water",
            "Expect cold nights because most alpine lakes sit above 3,500 metres",
        ],
        "bestRegions": [
            {"name": "Kashmir", "slug": "kashmir", "note": "The Great Lakes and Tarsar Marsar are the finest lake treks in India."},
            {"name": "Uttarakhand", "slug": "uttarakhand", "note": "The mystery lake of Roopkund and the frozen Brahmatal."},
            {"name": "Himachal Pradesh", "slug": "himachal", "note": "Bhrigu Lake and Chandratal in the high Lahaul and Spiti country."},
        ],
        "beginnerNote": "Some are beginner friendly, such as Brahmatal and Bhrigu Lake, while others like the Great Lakes need moderate fitness and acclimatisation.",
    },
    "snow-treks": {
        "intro": "Snow treks put you on white trails through frosted pine forest and frozen meadows to glowing sunrise summits. With the right route they are the winter Himalaya at its most photogenic and, surprisingly, its most beginner friendly.",
        "overview": "There is nothing quite like your first walk on snow. Winter routes in Uttarakhand and Himachal give you powder underfoot, snow laden forests and a wide summit panorama, and the classics ask for nothing more than good gear and a guide. The season runs from December to February, and December is the gentlest way in.",
        "why": "There is nothing like your first walk on snow. Winter routes in Uttarakhand and Himachal deliver the full alpine experience of powder, snow laden forests and wide summit panoramas without any technical climbing, given the right guide and gear.",
        "prepare": [
            "Carry microspikes and gaiters because snow and ice underfoot are a given",
            "Pack winter grade insulation and an insulated sleeping system",
            "Trek from December to February and choose December if you are new to snow",
            "Never head above the snowline alone and go with a guide in winter",
        ],
        "bestRegions": [
            {"name": "Uttarakhand", "slug": "uttarakhand", "note": "Kedarkantha, Brahmatal and Dayara Bugyal are India's classic snow treks."},
            {"name": "Himachal Pradesh", "slug": "himachal", "note": "Kheerganga and Prashar Lake under fresh winter snow."},
            {"name": "Kashmir", "slug": "kashmir", "note": "Winter meadows and the Gulmarg area snowscape."},
        ],
        "beginnerNote": "The best beginner snow treks, Kedarkantha and Brahmatal, are made for a first timer with the right gear and a guide.",
    },
    "family-treks": {
        "intro": "Family treks are the easier, safer routes that work for children and mixed age groups. They keep the days short and the grades gentle, they serve up big scenery, and they often come with the comfort of homestays or fixed camps along the way.",
        "overview": "Trekking as a family is about choosing routes where the reward is high and the risk stays low. These treks hold altitude and daily distance modest, favour well supported trails, and pick destinations like meadows, lakes and viewpoints that keep younger walkers curious and moving.",
        "why": "Trekking as a family means choosing routes where the reward is high and the risk stays low. These treks keep altitude and daily distance modest, favour well supported trails, and pick destinations that keep younger walkers engaged.",
        "prepare": [
            "Choose easy graded routes with short daily distances",
            "Avoid altitude above roughly 3,500 metres with young children",
            "Prefer treks with homestay or fixed camp options for comfort",
            "Pack extra warm layers and snacks to keep children happy on the trail",
        ],
        "bestRegions": [
            {"name": "Himachal Pradesh", "slug": "himachal", "note": "Triund and Prashar Lake are short, scenic and well supported."},
            {"name": "Uttarakhand", "slug": "uttarakhand", "note": "Chopta, Deoriatal and Tungnath make gentle family days."},
            {"name": "Maharashtra Sahyadris", "slug": "maharashtra", "note": "Easy fort walks that suit mixed age groups."},
        ],
        "beginnerNote": "These are ideal for beginners and children alike, the gentlest and best supported routes we document.",
    },
}

# ── Regions (why trek here narrative; blurb lives in region_meta) ─────────────
REGION_WHY: dict[str, str] = {
    "uttarakhand": "Uttarakhand is where most Indians take their first Himalayan trek. Garhwal and Kumaon pack an extraordinary range into short approaches, from beginner snow summits like Kedarkantha and Brahmatal to the flower meadows of the Valley of Flowers and serious high routes like Roopkund, and almost all of them sit within a day of the roadhead. Well marked trails, a mature guiding network and reliable winter snow make this the friendliest big mountain region in the country for a first timer.",
    "himachal": "No Indian state offers more variety than Himachal. In one state you can walk the green Kullu valleys, cross a glaciated pass on Hampta, camp beside Bhrigu Lake, or step into the cold desert of Spiti and Pin Parvati. That range, from lush to lunar and gentle to technical, together with easy access from Delhi and Chandigarh, makes Himachal the trekker's playground across almost every season.",
    "kashmir": "The high meadows of Kashmir are simply unrivalled in India. The Great Lakes trek strings together a chain of turquoise alpine lakes below jagged peaks, and Tarsar Marsar delivers the same beauty with far fewer people. Lush pasture, wildflowers and a short but spectacular summer window make Kashmir the country's premier destination for meadow and lake trekking.",
    "ladakh": "Ladakh is high altitude trekking at its most raw. Every route stays above 3,500 metres, crossing ochre moonscapes, Buddhist villages and glacier fed rivers on trails like Markha Valley, Stok Kangri and the frozen Chadar. This is a region for acclimatised, experienced trekkers who are chasing big altitude and stark, otherworldly landscapes rather than green meadows.",
    "maharashtra": "The Sahyadris of Maharashtra are the monsoon trekking capital of India. When the Himalaya shuts down for the rains, these basalt ranges erupt with waterfalls, fort ramparts and misty ridgelines. With more than seventy documented routes within a few hours of Mumbai and Pune, the Sahyadris deliver dramatic, accessible weekend trekking from June right through February.",
    "sikkim": "Sikkim and the North East pair jaw dropping Kanchenjunga views with some of the richest biodiversity in India. Goecha La, Dzongri and the ridge walk to Sandakphu pass through rhododendron forest, high yak pasture and orchid strewn valleys. Quieter and greener than the western Himalaya, this region rewards trekkers who want scenery and solitude in equal measure.",
    "karnataka": "Karnataka brings the Western Ghats within a weekend of Bengaluru. The rolling grasslands of Kudremukh, the granite dome of Kumara Parvatha and the coffee country ridgelines of Tadiyandamol range from gentle to genuinely tough. Lush, green and easy to reach, it is the most rewarding trekking region in the south.",
    "nepal": "The Nepal Himalaya holds the greatest concentration of eight thousand metre giants on Earth and the most storied treks in the world. From the Everest Base Camp trail to the Annapurna Circuit and the wild approaches to Kanchenjunga and Makalu, Nepal blends soaring high altitude scenery with a deep teahouse trekking culture that makes long routes surprisingly accessible.",
    "pakistan": "The Karakoram of Pakistan packs the most extreme high peaks on the planet into one range, from K2 and the Gasherbrums to Broad Peak and, close by, Nanga Parbat. Treks like the Baltoro Glacier to Concordia walk beneath a wall of eight thousand metre peaks unlike anywhere else. Remote, permit heavy and serious, Gilgit Baltistan is high altitude trekking at the sharpest end.",
    "tibet": "Tibet is the high, remote north side of the Himalaya, a vast high altitude desert of turquoise lakes, monasteries and the north approaches to Everest, Cho Oyu and Shishapangma. Big logistics and strict, guide only permits are the price of admission to some of the most austere and spiritual trekking terrain on Earth.",
}


def _esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def hub_to_html(hub: dict[str, Any], heading_name: str) -> str:
    """Render a structured hub dict into readable content_html (for the editor overlay + generic
    consumers). The frontend renders the structured fields directly; this is the human editable body."""
    parts: list[str] = []
    if hub.get("intro"):
        parts.append(f"<p>{_esc(hub['intro'])}</p>")
    if hub.get("overview"):
        parts.append(f"<p>{_esc(hub['overview'])}</p>")
    if hub.get("why"):
        parts.append(f"<h2>Why {heading_name}</h2><p>{_esc(hub['why'])}</p>")
    if hub.get("bestRegions"):
        parts.append("<h2>Best regions</h2><ul>")
        parts.extend(f"<li><strong>{_esc(r['name'])}</strong>: {_esc(r['note'])}</li>" for r in hub["bestRegions"])
        parts.append("</ul>")
    if hub.get("monthTable"):
        parts.append("<h2>Month by month</h2><table><thead><tr><th>Month</th><th>Conditions</th></tr></thead><tbody>")
        parts.extend(f"<tr><td>{_esc(m['month'])}</td><td>{_esc(m['conditions'])}</td></tr>" for m in hub["monthTable"])
        parts.append("</tbody></table>")
    if hub.get("prepare"):
        parts.append("<h2>How to prepare</h2><ul>")
        parts.extend(f"<li>{_esc(p)}</li>" for p in hub["prepare"])
        parts.append("</ul>")
    if hub.get("packing"):
        parts.append("<h2>What to pack</h2><ul>")
        parts.extend(f"<li>{_esc(p)}</li>" for p in hub["packing"])
        parts.append("</ul>")
    if hub.get("weather"):
        parts.append(f"<h2>Weather and conditions</h2><p>{_esc(hub['weather'])}</p>")
    if hub.get("faqs"):
        parts.append("<h2>Frequently asked questions</h2>")
        for f in hub["faqs"]:
            parts.append(f"<h3>{_esc(f['q'])}</h3><p>{_esc(f['a'])}</p>")
    return "".join(parts)
