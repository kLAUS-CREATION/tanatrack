import About from "@/components/landing/about";
import Header from "@/components/landing/header";
import Hero from "@/components/landing/hero";
import Services from "@/components/landing/services";

export default function Page () {
    return <div className="container mx-auto font-sans">
       <Header />
       <Hero />
       <About />
       <Services />
    </div>
}
