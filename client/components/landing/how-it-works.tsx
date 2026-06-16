import { PlugZap, Radar, LineChart, ArrowRight } from "lucide-react";
import SectionHeading from "../shared/section-heading";

const steps = [
  {
    icon: PlugZap,
    title: "Connect your channels",
    desc: "Plug in your stores, warehouses and suppliers in minutes. Tana Track pulls everything into one source of truth — no spreadsheets required.",
  },
  {
    icon: Radar,
    title: "Track every movement",
    desc: "Receive, transfer and sell with confidence. Every stock change is logged in real time across locations, with an audit trail you can trust.",
  },
  {
    icon: LineChart,
    title: "Grow with insight",
    desc: "Turn live data into decisions — reorder before you run out, spot your best sellers, and scale to new locations without the chaos.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="container mx-auto py-16 space-y-10"
    >
      <div className="max-w-2xl">
        <SectionHeading
          title1="From chaos to clarity in"
          title2="three steps"
          desc="Getting started takes minutes, not months. Here's how teams go live with Tana Track."
        />
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
        {/* connecting line on desktop */}
        <div className="hidden md:block absolute top-[4.5rem] left-[16%] right-[16%] h-px bg-linear-to-r from-primary/0 via-primary/30 to-primary/0 -z-0" />

        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="relative p-6 rounded-xs border border-primary/20 dark:border-primary/15 bg-background2 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-6"
              style={{ animationDelay: `${i * 120}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="size-11 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <Icon className="size-5" />
                </div>
                <span className="font-clash text-4xl font-semibold text-primary/15 group-hover:text-primary/30 transition-colors duration-300 leading-none">
                  0{i + 1}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">
                {s.title}
              </h3>
              <p className="text-[13px] text-foreground-tertiary leading-relaxed">
                {s.desc}
              </p>
              {i < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute top-7 -right-2 size-4 text-primary/30" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
