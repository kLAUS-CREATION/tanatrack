"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import SectionHeading from "../shared/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is there really a free trial?",
    a: "Yes — every plan starts with a 14-day free trial. No credit card required, and you can cancel any time before it ends with a single click.",
  },
  {
    q: "Which sales channels and tools does it integrate with?",
    a: "Tana Track syncs with Shopify, Amazon, eBay, WooCommerce, Square and Stripe out of the box, plus a REST API and webhooks for anything custom.",
  },
  {
    q: "Can I migrate my existing inventory data?",
    a: "Absolutely. Import your products, variants and stock levels from a CSV in minutes, and our team is happy to help with larger migrations at no extra cost.",
  },
  {
    q: "How do you keep our data secure?",
    a: "Your data is encrypted in transit and at rest, with role-based access control, granular permissions and a full audit trail on every change.",
  },
  {
    q: "Does it work across multiple branches and warehouses?",
    a: "Yes — track unlimited locations, move stock between them with approvals, and give each team member access scoped to exactly what they need.",
  },
  {
    q: "What if I need help or want to cancel?",
    a: "Support is available by chat and email on every plan. You own your data and can export or cancel whenever you like — no lock-in, no hard feelings.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="container mx-auto py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-start">
        <div className="space-y-5 lg:sticky lg:top-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary uppercase tracking-[0.15em]">
            <MessagesSquare className="size-3.5" />
            FAQ
          </div>
          <SectionHeading
            title1="Questions?"
            title2="We've got answers"
            desc="Everything you need to know before getting started. Can't find what you're looking for?"
          />
          <Link
            href="#"
            className="inline-flex text-sm font-medium text-primary hover:underline"
          >
            Talk to our team →
          </Link>
        </div>

        <div className="rounded-tl-3xl rounded-xs border border-primary/20 dark:border-primary/15 bg-background2 px-5 sm:px-7">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-primary/10"
              >
                <AccordionTrigger className="text-[15px] text-foreground">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[13px] text-foreground-tertiary leading-relaxed pr-6">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
