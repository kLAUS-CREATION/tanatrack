import About from "@/components/landing/about";
import Hero from "@/components/landing/hero";
import Plans from "@/components/landing/plans";
import Services from "@/components/landing/services";
import Footer from "@/components/landing/footer";
import TrustStrip from "@/components/landing/trust-strip";
import CTA from "@/components/landing/cta";
import HowItWorks from "@/components/landing/how-it-works";
import Testimonials from "@/components/landing/testimonials";
import FAQ from "@/components/landing/faq";

export default function Page() {
  return (
    <div className="">
      <main className="space-y-12">
        <Hero />
        <TrustStrip />
        <Services />
        <HowItWorks />
        <About />
        <Testimonials />
        <Plans />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
