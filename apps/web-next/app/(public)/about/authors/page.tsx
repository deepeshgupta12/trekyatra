import { ContentPage } from "@/components/content/ContentPage";
import { Users } from "lucide-react";

export default function Authors() {
  return (
    <ContentPage
      eyebrow="Our editors"
      title="The people behind TrekYatra"
      subtitle="Field-tested, India-based, opinionated — and deeply in love with the mountains."
      icon={Users}
      blocks={[
        {
          title: "Our editorial philosophy",
          body: "TrekYatra's editorial team is small by design. We believe fewer, better guides — written by people who have actually walked the trail — are more valuable than hundreds of articles that reword each other. Every contributor is required to disclose when they last did the trek, and what they missed the last time.",
        },
        {
          eyebrow: "Core team",
          title: "The editors",
          cards: [
            {
              title: "Aarav Sharma — Senior Editor, Himalayas",
              body: "14 years trekking in Uttarakhand and Himachal. Has summited Kedarkantha in January, done the Kashmir Great Lakes four times, and once got mildly AMS-ed on Rupin Pass. Believes cotton kills above the snowline. Based in Delhi.",
            },
            {
              title: "Priya Menon — Editor, Sahyadris",
              body: "Grew up in Pune, has done every major Sahyadri fort trek at least twice. Specialises in monsoon trekking, Maharashtrian permits, and the kind of trail notes that actually tell you where the path gets slippery. Has an opinion about every trekking shoe brand.",
            },
            {
              title: "Karan Sood — Editor, Northeast & Sikkim",
              body: "Spent three seasons in Sikkim and Meghalaya building TrekYatra's Northeast coverage. Former environmental consultant. Writes the permit guides with the rigour of someone who has had to pay a fine for getting one wrong.",
            },
          ],
        },
        {
          title: "Contributing writers",
          body: "TrekYatra also works with a network of contributing trekkers, operators, and outdoor educators who contribute specific guides, permit updates, and seasonal reports. All contributors are identified on the pages they write.\n\nWe welcome pitches from experienced trekkers. If you have done a significant Indian trek recently and want to contribute, email hello@trekyatra.in with your most recent trek date, the trail you want to cover, and a short sample of your writing.",
        },
        {
          title: "Corrections and accountability",
          body: "Every author is responsible for the accuracy of their pages. If a guide goes out of date, the original author is the first person we contact. We believe accountability makes better content.\n\nFound an error in one of our guides? Email hello@trekyatra.in — we correct within 48 hours and credit you if the correction is material.",
        },
        {
          title: "Join the team",
          body: "We are always looking for trekkers who can contribute detailed, field-verified guides. We pay contributors per published piece and give full author credit. Priority areas: Ladakh, Zanskar, Northeast India, and the lesser-documented Himachal routes.\n\nEmail: hello@trekyatra.in with subject 'Contributor enquiry'.",
        },
      ]}
    />
  );
}
