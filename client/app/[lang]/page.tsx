import About from "@/components/landing/about";
import Header from "@/components/landing/header";
import Hero from "@/components/landing/hero";
import Plans from "@/components/landing/plans";
import Services from "@/components/landing/services";
import Footer from "@/components/landing/footer";

export default function Page() {
  return (
    <div className="font-sans">
      <Header />
      <main className="space-y-32">
        <Hero />
        <Services />
        <About />
        <Plans />
      </main>
      <Footer />
    </div>
  );
}
