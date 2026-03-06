import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";

const Hero = function () {
  return (
    <section className="container mx-auto min-h-[100vh] py-20 flex flex-col lg:flex-row items-center justify-between relative overflow-hidden">
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-linear-to-b from-primary/20  dark:from-primary/10 to-secondary/10 blur-[120px]" />
      <div className="w-full lg:w-[50%] space-y-3 z-10">
        <h1 className="text-3xl lg:text-4xl 2xl:text-5xl leading-[1.05] font-clash">
          Master Your <span className="text-primary">Inventory</span>  <br />
          <span className="font-satoshi text-foreground-secondary italic">Scale Your Business.</span>
        </h1>
        <p className="text-lg lg:text-xl font-normal leading-relaxed max-w-xl text-foreground-tertiary">
          The all-in-one platform to track, manage, and optimize your stock across every channel.
          Real-time insights for ambitious brands.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <Button size="lg">
            Start Free Trial
          </Button>
          <Button variant={"outline"} size="lg">
            Watch Demo
          </Button>
        </div>
        <div className="flex items-center gap-6 pt-4 text-sm text-foreground-quaternary font-medium">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary" />
            14-day free trial
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[50%] mt-16 lg:mt-0 relative group">
          <Image
            src={"/images/hero1.jpg"}
            alt="Tana Track Inventory Dashboard Mockup"
            width={1200}
            height={800}
            className="rounded-xs rounded-tl-4xl object-cover shadow-lg transform group-hover:scale-[1.02] transition-transform duration-700"
          />
      </div>
    </section>
  );
};

export default Hero;
