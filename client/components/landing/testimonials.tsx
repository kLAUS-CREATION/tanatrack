import Image from "next/image";
import { Star, Quote } from "lucide-react";
import SectionHeading from "../shared/section-heading";

const testimonials = [
  {
    quote:
      "We replaced three spreadsheets and a clipboard with Tana Track. Stockouts dropped to almost zero and our team finally trusts the numbers.",
    name: "Sara Mengistu",
    role: "Ops Lead, Habesha Goods",
    avatar: 11,
  },
  {
    quote:
      "Rolling out to five branches used to be a nightmare. Now a new location is live in an afternoon and everything stays in sync.",
    name: "Daniel Tesfaye",
    role: "Founder, Admas Retail",
    avatar: 32,
  },
  {
    quote:
      "The approval workflow is a lifesaver. Nothing moves without a paper trail, and I can see exactly who did what, when.",
    name: "Lily Abebe",
    role: "Finance Manager, Tana Foods",
    avatar: 47,
  },
  {
    quote:
      "Purchasing into a receiving pool and allocating later matches how we actually work. It just made sense from day one.",
    name: "Yonas Girma",
    role: "Warehouse Manager, BlueNile Supply",
    avatar: 5,
  },
  {
    quote:
      "Reports that used to take a full day now take a glance. We reorder smarter and waste a lot less capital on dead stock.",
    name: "Marta Hailu",
    role: "CEO, Sheba Cosmetics",
    avatar: 24,
  },
  {
    quote:
      "Onboarding the floor staff took ten minutes. The interface is clean and fast — people actually enjoy using it.",
    name: "Bruk Alemu",
    role: "Store Manager, Entoto Mart",
    avatar: 60,
  },
];

const Stars = () => (
  <div className="flex gap-0.5 text-primary">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className="size-3.5 fill-primary" />
    ))}
  </div>
);

export default function Testimonials() {
  return (
    <section id="testimonials" className="container mx-auto py-16 space-y-10">
      <div className="max-w-2xl">
        <SectionHeading
          title1="Loved by teams that"
          title2="move fast"
          desc="Thousands of growing brands run their stockroom on Tana Track. Here's what they say."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {testimonials.map((t, i) => (
          <figure
            key={i}
            className="relative p-6 rounded-xs border border-primary/20 dark:border-primary/15 bg-background2 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-4 group animate-in fade-in slide-in-from-bottom-6"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
          >
            <Quote className="absolute top-5 right-5 size-7 text-primary/10 group-hover:text-primary/20 transition-colors duration-300" />
            <Stars />
            <blockquote className="text-sm text-foreground-secondary leading-relaxed">
              “{t.quote}”
            </blockquote>
            <figcaption className="flex items-center gap-3 mt-auto pt-2">
              <div className="size-10 rounded-full overflow-hidden border border-primary/20 shrink-0">
                <Image
                  src={`https://i.pravatar.cc/100?u=${t.avatar}`}
                  alt={t.name}
                  width={40}
                  height={40}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {t.name}
                </p>
                <p className="text-xs text-foreground-tertiary">{t.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* social-proof strip */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 pt-4 text-center">
        <Stat number="4.9/5" label="Average rating" />
        <div className="hidden sm:block h-8 w-px bg-primary/15" />
        <Stat number="5,000+" label="Active brands" />
        <div className="hidden sm:block h-8 w-px bg-primary/15" />
        <Stat number="120M+" label="Items tracked" />
      </div>
    </section>
  );
}

const Stat = ({ number, label }: { number: string; label: string }) => (
  <div className="space-y-0.5">
    <p className="font-clash text-2xl font-semibold text-foreground">{number}</p>
    <p className="text-xs text-foreground-tertiary uppercase tracking-wider">
      {label}
    </p>
  </div>
);
