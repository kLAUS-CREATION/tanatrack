export interface NavLink {
  label: string;
  href: string;
}

export const mainNavigationLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];
