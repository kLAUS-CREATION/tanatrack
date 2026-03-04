import { TrendingUp, Zap, ShieldCheck, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import SectionHeading from "../shared/section-heading";

export default function About() {
  return (
    <section id="about" className="py-24 space-y-32">
      <StatsSection />
      <VisionSection />
    </section>
  );
}

const StatsSection = () => {
  const stats = [
    {
      number: "99.9%",
      label: "Stock Accuracy",
      desc: "Eliminate discrepancies with our precision tracking and real-time syncing capabilities.",
      icon: <ShieldCheck className="size-10 lg:size-12" />,
    },
    {
      number: "40%",
      label: "Faster Fulfillment",
      desc: "Optimize your picking and packing process to get orders out the door in record time.",
      icon: <Zap className="size-10 lg:size-12" />,
    },
    {
      number: "24/7",
      label: "Real-time Monitoring",
      desc: "Stay informed about your stock levels across all locations, every second of every day.",
      icon: <TrendingUp className="size-10 lg:size-12" />,
    },
    {
      number: "5000+",
      label: "Growing Brands",
      desc: "Join thousands of businesses that trust Tana Track to power their supply chain operations.",
      icon: <Globe className="size-10 lg:size-12" />,
    },
  ];

  return (
    <section className="container mx-auto space-y-16">
      <div className="max-w-2xl">
        <SectionHeading
          title1="Performance that"
          title2={"Drives Results"}
          desc={'We provide the tools and insights you need to turn your inventory into a competitive advantage.'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="p-8 rounded-3xl bg-primary/5 border border-primary/10 hover:border-primary/20 transition-all duration-300 group shadow-sm"
          >
            <div className="text-primary mb-8 group-hover:scale-110 transition-transform duration-300">
              {stat.icon}
            </div>
            <h3 className="text-4xl font-bold text-foreground mb-2">
              {stat.number}
            </h3>
            <p className="font-bold text-lg text-foreground-secondary mb-3">{stat.label}</p>
            <p className="text-sm text-foreground-tertiary leading-relaxed">{stat.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const VisionSection = () => {
  return (
    <section className="container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-10">
          <SectionHeading
            title1="Our Vision for the"
            title2="Future of Commerce"
            desc={`In a world of rapidly evolving supply chains, Tana Track was built to give businesses back control. We believe that inventory should never be a bottleneck to your growth.

            Our platform combines cutting-edge technology with intuitive design to simplify the most complex aspects of stock management, from automated procurement to global multi-channel fulfillment.`}
          />
          <div className="flex items-center gap-4">
            <Button size="lg" className="h-14 px-8">
              Read Our Story <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="size-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                  <Image
                    src={`https://i.pravatar.cc/150?u=${i}`}
                    alt="User avatar"
                    width={40}
                    height={40}
                  />
                </div>
              ))}
              <div className="flex items-center justify-center size-10 rounded-full border-2 border-background bg-primary text-[10px] font-bold text-primary-foreground">
                +2k
              </div>
            </div>
            <span className="text-sm font-medium text-foreground-tertiary">Trusted by experts</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10 rounded-full" />
          <div className="rounded-[40px] overflow-hidden shadow-2xl border border-white/5">
            <Image
              width={800}
              height={800}
              src={"/images/hero1.jpg"}
              alt="Team collaborating on inventory"
              className="w-full aspect-square object-cover"
            />
          </div>
          <div className="absolute -bottom-10 -left-10 p-8 rounded-3xl bg-background border border-border shadow-2xl animate-bounce-slow">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">+85%</p>
                <p className="text-xs font-medium text-foreground-tertiary uppercase tracking-wider">Efficiency gain</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


