import localFont from "next/font/local";

// Inter — Main app font
export const inter = localFont({
  src: [
    {
      path: "../../public/fonts/inter/Inter-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/inter/Inter-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/inter/Inter-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/inter/Inter-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});


// Clash Display — Headings
export const clash = localFont({
  src: [
    {
      path: "../../public/fonts/clash/ClashDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/clash/ClashDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/clash/ClashDisplay-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/clash/ClashDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-clash",
  display: "swap",
});


// Satoshi — Optional modern font
export const satoshi = localFont({
  src: [
    {
      path: "../../public/fonts/satoshi/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});
