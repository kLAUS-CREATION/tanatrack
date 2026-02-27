import About from "@/components/landing/about";
import Header from "@/components/landing/header";
import Hero from "@/components/landing/hero";
import Plans from "@/components/landing/plans";
import Services from "@/components/landing/services";

export default function Page() {
  return (
    <div className="container mx-auto font-sans space-y-10">
      <Header />
      <Hero />
      <About />
      <Services />
      <Plans />
    </div>
  );
}
