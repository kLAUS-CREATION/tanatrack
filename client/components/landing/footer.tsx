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
            { name: "SaaS Dashboard", href: "/dashboard" },
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
        <footer className="bg-primary/5 pt-24 pb-12 border-t border-primary/10">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    <div className="lg:col-span-2 space-y-8">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-primary/20">
                                <Box size={24} />
                            </div>
                            <span className="text-2xl font-bold tracking-tight">
                                Tana <span className="text-primary italic">Track</span>
                            </span>
                        </Link>
                        <p className="text-foreground-tertiary max-w-sm leading-relaxed font-medium">
                            The modern standard for inventory management. Built for ambitious brands that need precision, scale, and real-time control.
                        </p>
                        <div className="flex gap-4">
                            {socialLinks.map((social, index) => (
                                <Link
                                    key={index}
                                    href={social.href}
                                    className="size-10 rounded-full border border-primary/10 flex items-center justify-center text-foreground-tertiary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                                >
                                    <social.icon size={18} />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {footerLinks.map((group, index) => (
                        <div key={index} className="space-y-6">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">
                                {group.title}
                            </h4>
                            <ul className="space-y-4">
                                {group.links.map((link, lIndex) => (
                                    <li key={lIndex}>
                                        <Link
                                            href={link.href}
                                            className="text-foreground-tertiary hover:text-primary transition-colors duration-300 text-sm font-medium italic"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pt-12 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-sm text-foreground-quaternary font-medium italic">
                        © {new Date().getFullYear()} Tana Track. All rights reserved.
                    </p>
                    <div className="flex gap-8">
                        <Link href="#" className="text-xs text-foreground-quaternary hover:text-primary font-bold italic">Status</Link>
                        <Link href="#" className="text-xs text-foreground-quaternary hover:text-primary font-bold italic">Security</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
