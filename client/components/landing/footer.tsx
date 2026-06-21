import React from "react";
import Link from "next/link";
import { Box, Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";

const footerLinks = [
    {
        title: "Product",
        links: [
            { name: "Features", href: "#features" },
            { name: "Pricing", href: "#pricing" },
            { name: "Integrations", href: "#" },
            { name: "SaaS Dashboard", href: "/organizations" },
        ],
    },
    {
        title: "Company",
        links: [
            { name: "About Us", href: "#about" },
            { name: "Careers", href: "#" },
            { name: "Blog", href: "#" },
            { name: "Contact", href: "#" },
        ],
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", href: "#" },
            { name: "Terms of Service", href: "#" },
            { name: "Cookie Policy", href: "#" },
        ],
    },
];

const socialLinks = [
    { icon: Facebook, href: "#" },
    { icon: Twitter, href: "#" },
    { icon: Instagram, href: "#" },
    { icon: Linkedin, href: "#" },
    { icon: Github, href: "#" },
];

export default function Footer() {
    return (
        <footer className="bg-primary/5 pt-16 pb-8 border-t border-primary/10">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    <div className="lg:col-span-2 space-y-5">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="size-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground group-hover:rotate-12 transition-transform duration-300 shadow-md shadow-primary/20">
                                <Box size={18} />
                            </div>
                            <span className="text-lg font-bold tracking-tight font-clash">
                                Tana <span className="text-primary italic">Track</span>
                            </span>
                        </Link>
                        <p className="text-foreground-tertiary max-w-xs text-[13px] leading-relaxed">
                            The modern standard for inventory management. Built for ambitious brands that need precision, scale, and real-time control.
                        </p>
                        <div className="flex gap-2.5">
                            {socialLinks.map((social, index) => (
                                <Link
                                    key={index}
                                    href={social.href}
                                    className="size-8 rounded-full border border-primary/15 flex items-center justify-center text-foreground-tertiary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                                >
                                    <social.icon size={15} />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {footerLinks.map((group, index) => (
                        <div key={index} className="space-y-4">
                            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">
                                {group.title}
                            </h4>
                            <ul className="space-y-2.5">
                                {group.links.map((link, lIndex) => (
                                    <li key={lIndex}>
                                        <Link
                                            href={link.href}
                                            className="text-foreground-tertiary hover:text-primary transition-colors duration-300 text-[13px] font-medium"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pt-8 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-foreground-quaternary font-medium">
                        © {new Date().getFullYear()} Tana Track. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="#" className="text-xs text-foreground-quaternary hover:text-primary font-bold">Status</Link>
                        <Link href="#" className="text-xs text-foreground-quaternary hover:text-primary font-bold">Security</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
