import { Check, ArrowRight } from "lucide-react";
import SectionHeading from "../shared/section-heading";
import { Button } from "@/components/ui/button";

const tiers = [
    {
        name: "Starter",
        price: "49",
        description: "Perfect for small boutiques and growing online shops.",
        features: [
            "Up to 1,000 SKUs",
            "2 Warehouse locations",
            "Basic Analytics",
            "Email Support",
            "Shopify Integration",
        ],
        cta: "Start Free Trial",
        popular: false,
    },
    {
        name: "Professional",
        price: "129",
        description: "Advanced tools for high-volume retailers and distributors.",
        features: [
            "Unlimited SKUs",
            "10 Warehouse locations",
            "Advanced Forecasting",
            "24/7 Priority Support",
            "Multi-channel Syncing",
            "Custom API Access",
        ],
        cta: "Scale Now",
        popular: true,
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "SLA-backed solutions for global supply chain operations.",
        features: [
            "Global Multi-warehouse",
            "Dedicated account manager",
            "On-premise deployment",
            "Custom Integrations",
            "SSO & Advanced Security",
            "Personnel Training",
        ],
        cta: "Contact Sales",
        popular: false,
    },
];

export default function Plans() {
    return (
        <section id="pricing" className="py-16 space-y-10">
            <div className="container mx-auto flex justify-center text-center">
                <SectionHeading
                    center
                    title1="Simple pricing for"
                    title2={"complex challenges"}
                    desc="No hidden fees. Scale your plan as your business grows. 14-day free trial on all plans."
                />
            </div>

            <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {tiers.map((tier, index) => (
                    <div
                        key={index}
                        className={`relative p-6 rounded-xs border flex flex-col transition-all duration-300 ${tier.popular
                            ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 md:-translate-y-2 z-10"
                            : "border-primary/20 dark:border-primary/15 bg-background2 hover:border-primary/40"
                            }`}
                    >
                        {tier.popular && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                Most Popular
                            </div>
                        )}

                        <div className="mb-5">
                            <h3 className="text-base font-bold tracking-tight mb-1">{tier.name}</h3>
                            <p className="text-foreground-tertiary text-xs leading-relaxed">
                                {tier.description}
                            </p>
                        </div>

                        <div className="mb-6 flex items-baseline gap-1">
                            <span className="text-3xl font-clash font-bold tracking-tight">
                                {tier.price === "Custom" ? "" : "$"}
                                {tier.price}
                            </span>
                            {tier.price !== "Custom" && (
                                <span className="text-foreground-quaternary font-medium text-sm">
                                    /month
                                </span>
                            )}
                        </div>

                        <ul className="space-y-2.5 mb-7 flex-1">
                            {tier.features.map((feature, fIndex) => (
                                <li key={fIndex} className="flex items-start gap-2.5">
                                    <div className="size-4 shrink-0 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                                        <Check className="size-2.5 text-primary stroke-[3px]" />
                                    </div>
                                    <span className="text-[13px] font-medium text-foreground-secondary">
                                        {feature}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <Button
                            variant={tier.popular ? "default" : "outline"}
                            className="w-full group"
                        >
                            {tier.cta}
                            <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                    </div>
                ))}
            </div>
        </section>
    );
}
