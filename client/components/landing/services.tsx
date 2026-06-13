import { Box, RefreshCw, BarChart3, Globe, ScanBarcode, Users2 } from 'lucide-react';
import SectionHeading from '../shared/section-heading';

const features = [
  {
    icon: Box,
    title: 'Real-time Tracking',
    desc: 'Monitor stock levels across multiple warehouses and locations in real-time. Never lose track of an item again.'
  },
  {
    icon: RefreshCw,
    title: 'Automated Reordering',
    desc: 'Set smart low-stock alerts and automate purchase orders to ensure you always have what your customers need.'
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    desc: 'Get deep insights into product performance, turnover rates, and sales trends with customizable reports.'
  },
  {
    icon: Globe,
    title: 'Multichannel Sync',
    desc: 'Automatically sync inventory levels across Shopify, Amazon, eBay, and your physical stores from one dashboard.'
  },
  {
    icon: ScanBarcode,
    title: 'Barcode Management',
    desc: 'Generate, print, and scan barcodes for fast receiving, picking, and packing. Eliminate manual entry errors.'
  },
  {
    icon: Users2,
    title: 'Team Collaboration',
    desc: 'Assign roles and permissions to your warehouse staff. Track every movement with detailed activity logs.'
  },
];

const Features: React.FC = () => {
  return (
    <div id="features" className="py-4 space-y-16 animate-in slide-in-from-bottom-10 duration-700 container mx-auto">
      <div className="max-w-3xl">
        <SectionHeading
          title1='Powerful Features for'
          title2={'Modern Inventory'}
          desc={'Everything you need to manage your supply chain, reduce overhead, and scale your operations globally.'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {features.map((f, i) => (
          <div key={i} className="p-4 rounded-xs border border-primary/50 dark:border-primary/30  bg-background2 backdrop-blur-sm hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 group">
            <h3 className="text-2xl font-normal text-foreground mb-3">{f.title}</h3>
            <p className="text-foreground-secondary leading-relaxed font-normal">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;
