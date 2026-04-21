from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class TrekRecord:
    slug: str
    name: str
    region: str
    state: str
    duration: str
    altitude: str
    difficulty: str
    season: str
    description: str
    beginner: bool = False


TREKS: list[TrekRecord] = [
    TrekRecord(
        slug="kedarkantha",
        name="Kedarkantha",
        region="Garhwal Himalayas",
        state="Uttarakhand",
        duration="6 days",
        altitude="12,500 ft",
        difficulty="Moderate",
        season="Dec – Apr",
        beginner=True,
        description="India's most loved beginner snow trek — 360° summit views, frozen forest campsites, and a gentle ridge climb.",
    ),
    TrekRecord(
        slug="valley-of-flowers",
        name="Valley of Flowers",
        region="Garhwal Himalayas",
        state="Uttarakhand",
        duration="6 days",
        altitude="14,400 ft",
        difficulty="Moderate",
        season="Jul – Sep",
        description="A monsoon-only UNESCO valley carpeted in over 500 species of alpine flowers.",
    ),
    TrekRecord(
        slug="hampta-pass",
        name="Hampta Pass",
        region="Pir Panjal",
        state="Himachal Pradesh",
        duration="5 days",
        altitude="14,100 ft",
        difficulty="Moderate",
        season="Jun – Sep",
        description="A dramatic crossover from green Kullu to barren Lahaul — the closest thing India has to a magical pass trek.",
    ),
    TrekRecord(
        slug="kashmir-great-lakes",
        name="Kashmir Great Lakes",
        region="Kashmir Valley",
        state="Jammu & Kashmir",
        duration="8 days",
        altitude="13,800 ft",
        difficulty="Difficult",
        season="Jul – Sep",
        description="Seven turquoise alpine lakes, rolling meadows, and the most scenic high-altitude trek in India.",
    ),
    TrekRecord(
        slug="rajmachi",
        name="Rajmachi Monsoon Trek",
        region="Sahyadris",
        state="Maharashtra",
        duration="2 days",
        altitude="2,710 ft",
        difficulty="Easy",
        season="Jun – Sep",
        beginner=True,
        description="Twin forts, rain-washed plateaus, and fireflies — the quintessential weekend monsoon trek from Mumbai/Pune.",
    ),
    TrekRecord(
        slug="markha-valley",
        name="Markha Valley",
        region="Ladakh",
        state="Ladakh",
        duration="8 days",
        altitude="17,100 ft",
        difficulty="Difficult",
        season="Jun – Sep",
        description="Ladakh's classic teahouse trek — Buddhist villages, river crossings, and the Kang Yatse panorama.",
    ),
    TrekRecord(
        slug="brahmatal",
        name="Brahmatal",
        region="Garhwal Himalayas",
        state="Uttarakhand",
        duration="6 days",
        altitude="12,250 ft",
        difficulty="Moderate",
        season="Dec – Mar",
        beginner=True,
        description="The quieter snow-trek alternative to Kedarkantha — frozen lakes and the Trishul-Nanda Ghunti wall up close.",
    ),
    TrekRecord(
        slug="rupin-pass",
        name="Rupin Pass",
        region="Western Himalayas",
        state="Himachal Pradesh",
        duration="8 days",
        altitude="15,250 ft",
        difficulty="Challenging",
        season="May – Jun, Sep – Oct",
        description="A trek that changes scenery every 2 hours — hanging villages, three-stage waterfall, and a snow-wall pass crossing.",
    ),
    TrekRecord(
        slug="kalsubai",
        name="Kalsubai",
        region="Sahyadris",
        state="Maharashtra",
        duration="1 day",
        altitude="5,400 ft",
        difficulty="Moderate",
        season="Oct – Feb",
        description="Maharashtra's highest peak — iron-ladder thrill and a night-trek tradition for Mumbai trekkers.",
    ),
    TrekRecord(
        slug="sandakphu",
        name="Sandakphu Phalut",
        region="Singalila Ridge",
        state="West Bengal / Sikkim",
        duration="6 days",
        altitude="11,950 ft",
        difficulty="Moderate",
        season="Oct – Dec, Mar – May",
        description="The only trek that shows you Everest, Kanchenjunga, Lhotse and Makalu lined up at sunrise.",
    ),
    TrekRecord(
        slug="chadar",
        name="Chadar Frozen River",
        region="Zanskar",
        state="Ladakh",
        duration="9 days",
        altitude="11,150 ft",
        difficulty="Challenging",
        season="Jan – Feb",
        description="Walking on the frozen Zanskar river at -25°C — bucket-list winter expedition for serious trekkers.",
    ),
    TrekRecord(
        slug="harishchandragad",
        name="Harishchandragad",
        region="Sahyadris",
        state="Maharashtra",
        duration="2 days",
        altitude="4,670 ft",
        difficulty="Moderate",
        season="Oct – Mar",
        description="Konkan Kada cliff at sunrise, ancient caves, and the most photographed plateau in the Sahyadris.",
    ),
]
