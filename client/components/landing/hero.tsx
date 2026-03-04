import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";

const Hero = function () {
  return (
    <section className="container mx-auto min-h-[100vh] py-20 flex flex-col lg:flex-row items-center justify-between relative overflow-hidden">
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-linear-to-b from-primary/20  dark:from-primary/10 to-secondary/10 blur-[120px]" />
      <div className="w-full lg:w-[50%] space-y-8 z-10">
        <h1 className="text-3xl lg:text-4xl 2xl:text-5xl leading-[1.05] font-clash font-bold">
          Master Your <span className="text-primary">Inventory</span>  <br />
          <span className="font-satoshi text-foreground-secondary italic">Scale Your Business.</span>
        </h1>
        <p className="text-lg lg:text-2xl font-normal leading-relaxed max-w-xl text-foreground-tertiary">
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
            No credit card required
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary" />
            14-day free trial
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[50%] mt-16 lg:mt-0 relative group">
        <div className="absolute inset-0 bg-primary/20 blur-[80px] -z-10 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative rounded-2xl border border-white/5 bg-background/50 backdrop-blur-3xl p-2 shadow-2xl overflow-hidden">
          <Image
            src={"/images/hero1.jpg"}
            alt="Tana Track Inventory Dashboard Mockup"
            width={1200}
            height={800}
            className="rounded-xl object-cover shadow-lg transform group-hover:scale-[1.02] transition-transform duration-700"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;

// 'use client';
//
// import { Button } from "@/components/ui/button";
// import Image from "next/image";
// import React from "react";
// import { useTranslations } from "next-intl";
//
// const Hero = function () {
//   const t = useTranslations("hero");
//
//   return (
//     <section className="container h-[90vh] flex items-center justify-between relative overflow-hidden">
//       <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-linear-to-b from-primary/20 dark:from-primary/10 to-secondary/10 blur-[120px]" />
//
//       <div className="w-full lg:w-[50%] space-y-5">
//         <h1 className="text-4xl lg:text-5xl leading-[1.1] font-clash font-normal">
//           {t("title.part1")}{" "}
//           <span className="text-primary font-semibold">
//             {t("title.highlight")}
//           </span>
//           <br />
//           <span className="font-satoshi">
//             {t("title.part2")}
//           </span>
//         </h1>
//
//         <p className="text-base lg:text-xl font-normal leading-[1.4] tracking-[1px] max-w-xl text-foreground-secondary">
//           {t("description")}
//         </p>
//
//         <div className="flex items-center gap-3">
//           <Button variant="default">
//             {t("buttons.dashboard")}
//           </Button>
//
//           <Button variant="outline">
//             {t("buttons.plans")}
//           </Button>
//         </div>
//       </div>
//
//       <div className="hidden lg:flex lg:w-[50%] h-[70%]">
//         <Image
//           src={"/images/hero1.jpg"}
//           alt={t("imageAlt")}
//           width={800}
//           height={600}
//           className="size-full object-cover rounded-tl-[25%] shadow-lg"
//         />
//       </div>
//     </section>
//   );
// };
//
// export default Hero;
