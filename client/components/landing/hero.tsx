import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";

const Hero = function () {
  return (
    <section className="container h-[90vh] flex items-center justify-between relative overflow-hidden">
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-linear-to-b from-primary/20  dark:from-primary/10 to-secondary/10 blur-[120px]" />
      <div className="w-full lg:w-[50%] space-y-5">
        <h1 className="text-4xl lg:text-5xl leading-[1.1] font-clash font-normal">
          Master Your <span className="text-primary font-semibold">Inventory</span>  <br /> <span className="font-satoshi">Grow Without Limits.</span>
        </h1>
        <p className="text-base lg:text-xl  font-normal leading-[1.4] tracking-[1px] max-w-xl text-foreground-secondary ">
          Track and optimize your stock in real-time with our all-in-one
          inventory solution. Stay in control and scale effortlessly
        </p>
        <div className="flex items-center gap-3">
          <Button variant={"default"}> Get Dashboard </Button>
          <Button variant={"outline"}> See Plans </Button>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-[50%] h-[70%]">
        <Image
          src={"/images/hero1.jpg"}
          alt="Hero Image"
          width={800}
          height={600}
          className="size-full object-cover rounded-tl-[25%] shadow-lg"
        />
      </div>
    </section>
  );
};

export default Hero;
