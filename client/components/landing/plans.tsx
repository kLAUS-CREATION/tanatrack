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
        <section id="pricing" className="py-24 space-y-16">
            <div className="container mx-auto text-center">
                <SectionHeading
                    title1="Simple Pricing for"
                    title2={"Complex Challenges"}
                    desc="No hidden fees. Scale your plan as your business grows. 14-day free trial on all plans."
                />
            </div>

            <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {tiers.map((tier, index) => (
                    <div
                        key={index}
                        className={`relative p-10 rounded-[2.5rem] border ${tier.popular
                                ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10 scale-105 z-10"
                                : "border-border bg-card shadow-sm"
                            } flex flex-col transition-all duration-300 hover:shadow-xl`}
                    >
                        {tier.popular && (
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest">
                                Most Popular
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                            <p className="text-foreground-tertiary text-sm leading-relaxed">
                                {tier.description}
                            </p>
                        </div>

                        <div className="mb-10 flex items-baseline gap-1">
                            <span className="text-5xl font-clash font-bold">
                                {tier.price === "Custom" ? "" : "$"}
                                {tier.price}
                            </span>
                            {tier.price !== "Custom" && (
                                <span className="text-foreground-quaternary font-medium text-lg">
                                    /month
                                </span>
                            )}
                        </div>

                        <ul className="space-y-4 mb-12 flex-1">
                            {tier.features.map((feature, fIndex) => (
                                <li key={fIndex} className="flex items-start gap-3">
                                    <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                                        <Check className="size-3 text-primary stroke-[3px]" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground-secondary italic">
                                        {feature}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <Button
                            variant={tier.popular ? "default" : "outline"}
                            size="lg"
                            className={`w-full h-14 text-lg font-bold rounded-2xl ${!tier.popular && "border-primary/20 hover:bg-primary/5"
                                }`}
                        >
                            {tier.cta}
                            <ArrowRight className="ml-2 size-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </section>
    );
}
