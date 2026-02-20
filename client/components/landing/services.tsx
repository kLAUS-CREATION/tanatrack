import React from 'react';
import { Home, Key, ShieldCheck, MapPin, BarChart3, Users } from 'lucide-react';
import SectionHeading from '../shared/section-heading';

const services = [
  { icon: Home, title: 'Buy a Home', desc: 'Find your dream home with our expert agents who know every corner of the market.' },
  { icon: Key, title: 'Sell a Home', desc: 'Get the best value for your property with our premium marketing strategies and network.' },
  { icon: ShieldCheck, title: 'Property Management', desc: 'Stress-free ownership with our comprehensive management and maintenance services.' },
  { icon: MapPin, title: 'Location Scouting', desc: 'Need a specific neighborhood? We analyze trends to find the next growing hotspots.' },
  { icon: BarChart3, title: 'Investment Advice', desc: 'Grow your portfolio with data-driven insights and high-yield property recommendations.' },
  { icon: Users, title: 'Legal Support', desc: 'Seamless transactions with our network of top-tier real estate attorneys and consultants.' },
];

const Services: React.FC = () => {
  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700">
     <SectionHeading title1='Our Premium' title2={'Services'} desc={'Tailored solutions for every real estate need. We combine tradition with innovation.'}/>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
        {services.map((s, i) => (
          <div key={i} className="p-5 rounded-lg  border border-primary/40  hover:shadow-lg transition-all duration-500 group">
            <div className="w-16 h-16  rounded-2xl flex items-center justify-center mb-8  text-primary transition-colors duration-500">
              <s.icon size={32} />
            </div>
            <h3 className="text-xl lg:text-2xl  text-foreground-secondary mb-4">{s.title}</h3>
            <p className="text-foreground-tertiary leading-relaxed text-sm">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;
