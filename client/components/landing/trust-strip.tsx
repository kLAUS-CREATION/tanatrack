const brands = ["Shopify", "Amazon", "eBay", "Stripe", "Square", "WooCommerce"];

export default function TrustStrip() {
  return (
    <section className="container mx-auto">
      <div className="border-y border-primary/10 py-8">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-foreground-quaternary mb-6">
          Syncs with the tools you already use
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {brands.map((brand) => (
            <span
              key={brand}
              className="text-base lg:text-lg font-clash font-semibold text-foreground-quaternary/70 hover:text-foreground-secondary transition-colors duration-300 select-none"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
