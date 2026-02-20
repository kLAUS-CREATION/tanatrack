import { Users, Code, Calendar, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import SectionHeading from "../shared/section-heading";

export default function About() {
  return (
    <section id="about" className="container mx-auto">
      <StatsSection />
      <TimelineSection />
    </section>
  );
}

const StatsSection = () => {
  const stats = [
    {
      number: "120+",
      label: "Active Members",
      desc: "A vibrant community of passionate developers and tech enthusiasts from ASTU.",
      icon: <Users className="size-10 lg:size-12 " />,
    },
    {
      number: "40+",
      label: "Open Source Projects",
      desc: "Collaborative projects ranging from web apps to machine learning models.",
      icon: <Code className="size-10 lg:size-12" />,
    },
    {
      number: "20+",
      label: "Annual Workshops",
      desc: "Hands-on sessions covering the latest stacks and industry standards.",
      icon: <Calendar className="size-10 lg:size-12" />,
    },
    {
      number: "10+",
      label: "Years of Excellence",
      desc: "Fostering innovation and technical growth since our establishment.",
      icon: <Rocket className="size-10 lg:size-12" />,
    },
  ];

  return (
    <section className="w-full mx-auto space-y-10">
     <SectionHeading title1="Our Impact by" title2={"Numbers"} desc={'We are more than just a club; we are a hub for innovation at ASTU, empowering students to build the future.'} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="p-4 rounded-xs bg-linear-to-tr from-primary to-secondary  border transition-colors group shadow-sm"
          >
            <div className="text-gray-200 mb-10">
              {stat.icon}
            </div>
            <h3 className="text-3xl font-bold text-text1 mb-1 text-gray-50">
              {stat.number}
            </h3>
            <p className="font-semibold text-text2 mb-3 text-gray-100">{stat.label}</p>
            <p className="text-sm text-text2 leading-relaxed text-gray-100">{stat.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const TimelineSection = () => {
  const milestones = [
    {
      year: "2019",
      title: "The Genesis",
      desc: "CSEC ASTU was founded with a vision to bridge the gap between academic theory and practical software engineering.",
    },
    {
      year: "2021",
      title: "Rapid Growth & First Hackathon",
      desc: "Launched our first campus-wide hackathon and grew to over 200 members during the pandemic era.",
      image:
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800",
    },
    {
      year: "2023",
      title: "Industry Partnerships",
      desc: "Established connections with top local tech firms, providing internship pathways for our high-performing members.",
    },
    {
      year: "Today",
      title: "ASTU's Tech Powerhouse",
      desc: "Now serving as the leading technical community at ASTU, driving innovation through daily standups and research.",
    },
  ];

  return (
    <section className="py-24 w-full mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div className="lg:sticky lg:top-32 space-y-10">
          <SectionHeading title1="Our Beautiful Story" title2={null} desc={`From a small group of enthusiasts to a community of hundreds,
            here's how CSEC ASTU evolved into a pillar of innovation. From a small group of enthusiasts to a community of hundreds,
            here's how CSEC ASTU evolved into a pillar of innovation. From a small group of enthusiasts to a community of hundreds,
            here's how CSEC ASTU evolved into a pillar of innovation. From a small group of enthusiasts to a community of hundreds,
            here's how CSEC ASTU evolved into a pillar of innovation.`}
            />
          <Button className="">
            View our full history <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>

        <div className="relative pl-8 border-l-2 border-text2 space-y-16">
          {milestones.map((item, index) => (
            <div key={index} className="relative">
              <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-white border-4 border-primary" />

              <span className="text-sm font-bold text-text1 tracking-widest uppercase mb-2 block">
                {item.year}
              </span>
              <h3 className="text-2xl font-bold text-text1 mb-3">
                {item.title}
              </h3>
              <p className="text-text2 leading-relaxed mb-6">{item.desc}</p>

              {item.image && (
                <div className="rounded-2xl overflow-hidden  shadow-sm">
                  <Image
                    width={500}
                    height={500}
                    src={"/images/hero1.jpg"}
                    alt="Milestone"
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


