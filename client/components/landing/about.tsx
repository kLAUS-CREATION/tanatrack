import { TrendingUp, Zap, ShieldCheck, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import SectionHeading from "../shared/section-heading";

export default function About() {
  return (
    <section id="about" className="py-16 space-y-24">
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
      desc: "Eliminate discrepancies with precision tracking and real-time syncing.",
      icon: <ShieldCheck className="size-5" />,
    },
    {
      number: "40%",
      label: "Faster Fulfillment",
      desc: "Optimize picking and packing to get orders out the door in record time.",
      icon: <Zap className="size-5" />,
    },
    {
      number: "24/7",
      label: "Real-time Monitoring",
      desc: "Stay informed about stock levels across all locations, every second.",
      icon: <TrendingUp className="size-5" />,
    },
    {
      number: "5000+",
      label: "Growing Brands",
      desc: "Join thousands of businesses that trust Tana Track to power their supply chain.",
      icon: <Globe className="size-5" />,
    },
  ];

  return (
    <section className="container mx-auto space-y-10">
      <div className="max-w-2xl">
        <SectionHeading
          title1="Performance that"
          title2={"drives results"}
          desc={'The tools and insights you need to turn inventory into a competitive advantage.'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="p-5 rounded-xs bg-background2 border border-primary/20 dark:border-primary/15 hover:border-primary/40 transition-all duration-300 group"
          >
            <div className="size-9 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
              {stat.icon}
            </div>
            <h3 className="text-2xl font-clash font-semibold text-foreground mb-1 tracking-tight">
              {stat.number}
            </h3>
            <p className="font-medium text-sm text-foreground-secondary mb-1.5">{stat.label}</p>
            <p className="text-xs text-foreground-tertiary leading-relaxed">{stat.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const VisionSection = () => {
  return (
    <section className="container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-7">
          <SectionHeading
            title1="Our vision for the"
            title2="future of commerce"
            desc={`Tana Track was built to give businesses back control. We believe inventory should never be a bottleneck to your growth.

            Our platform combines cutting-edge technology with intuitive design to simplify the most complex aspects of stock management — from automated procurement to global multi-channel fulfillment.`}
          />
          <div className="flex items-center gap-4">
            <Button>
              Read Our Story <ArrowRight className="ml-1 size-4" />
            </Button>
            <div className="flex -space-x-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="size-8 rounded-full border-2 border-background bg-muted overflow-hidden">
                  <Image
                    src={`https://i.pravatar.cc/150?u=${i}`}
                    alt="User avatar"
                    width={32}
                    height={32}
                  />
                </div>
              ))}
              <div className="flex items-center justify-center size-8 rounded-full border-2 border-background bg-primary text-[9px] font-bold text-primary-foreground">
                +2k
              </div>
            </div>
            <span className="text-xs font-medium text-foreground-tertiary">Trusted by experts</span>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-tl-3xl rounded-xs overflow-hidden shadow-lg border border-primary/10 h-[48vh]">
            <Image
              width={800}
              height={800}
              src={"/images/hero1.jpg"}
              alt="Team collaborating on inventory"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 p-4 rounded-xs bg-background border border-primary/20 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground leading-none">+85%</p>
                <p className="text-[10px] font-medium text-foreground-tertiary uppercase tracking-wider mt-1">Efficiency gain</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
