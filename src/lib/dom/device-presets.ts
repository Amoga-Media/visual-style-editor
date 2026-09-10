export interface DevicePreset {
  id: string;
  name: string;
  category: "desktop" | "tablet" | "mobile";
  width: number;
  height: number;
  description?: string;
  popular?: boolean;
}

export const DEVICE_PRESETS: DevicePreset[] = [
  // Desktop Presets
  {
    id: "desktop-standard",
    name: "Desktop (Standard)",
    category: "desktop",
    width: 1440,
    height: 900,
    description: "Default desktop resolution (16:10)",
    popular: true,
  },
  {
    id: "desktop-1080p",
    name: "Desktop Full HD (1080p)",
    category: "desktop",
    width: 1920,
    height: 1080,
    description: "Most popular external monitor",
    popular: true,
  },
  {
    id: "macbook-air-14",
    name: "MacBook Air / Pro 14\"",
    category: "desktop",
    width: 1512,
    height: 982,
    description: "Apple Retina 14-inch display",
  },
  {
    id: "macbook-pro-16",
    name: "MacBook Pro 16\"",
    category: "desktop",
    width: 1728,
    height: 1117,
    description: "Apple Retina 16-inch display",
  },
  {
    id: "desktop-laptop",
    name: "Laptop (Common)",
    category: "desktop",
    width: 1366,
    height: 768,
    description: "Standard 14-inch PC laptop",
  },
  {
    id: "desktop-small",
    name: "Small Screen / Notebook",
    category: "desktop",
    width: 1280,
    height: 800,
    description: "Compact 13-inch display",
  },
  {
    id: "desktop-2k",
    name: "2K QHD Display",
    category: "desktop",
    width: 2560,
    height: 1440,
    description: "High resolution workstation display",
  },
  {
    id: "desktop-fill",
    name: "Responsive Fluid (Fill)",
    category: "desktop",
    width: 0,
    height: 0,
    description: "Fills 100% of the canvas workspace",
  },

  // Tablet Presets
  {
    id: "ipad-standard",
    name: "iPad (Standard 10.2\")",
    category: "tablet",
    width: 768,
    height: 1024,
    description: "Default tablet breakpoint",
    popular: true,
  },
  {
    id: "ipad-air-10",
    name: "iPad Air / 10th Gen",
    category: "tablet",
    width: 820,
    height: 1180,
    description: "Modern edge-to-edge iPad",
    popular: true,
  },
  {
    id: "ipad-pro-11",
    name: "iPad Pro 11\"",
    category: "tablet",
    width: 834,
    height: 1194,
    description: "Apple iPad Pro 11-inch",
  },
  {
    id: "ipad-pro-12",
    name: "iPad Pro 12.9\"",
    category: "tablet",
    width: 1024,
    height: 1366,
    description: "Large 12.9-inch tablet",
  },
  {
    id: "ipad-mini",
    name: "iPad Mini",
    category: "tablet",
    width: 744,
    height: 1133,
    description: "Compact 8.3-inch tablet",
  },
  {
    id: "galaxy-tab-s9",
    name: "Samsung Galaxy Tab S9",
    category: "tablet",
    width: 800,
    height: 1280,
    description: "Android tablet standard (16:10)",
  },
  {
    id: "surface-pro",
    name: "Microsoft Surface Pro",
    category: "tablet",
    width: 912,
    height: 1368,
    description: "Windows 2-in-1 touchscreen",
  },

  // Mobile Presets
  {
    id: "iphone-15-base",
    name: "iPhone 15 / 14 / 13 / 12",
    category: "mobile",
    width: 390,
    height: 844,
    description: "Most popular modern iPhone",
    popular: true,
  },
  {
    id: "iphone-15-pro",
    name: "iPhone 15 / 14 Pro",
    category: "mobile",
    width: 393,
    height: 852,
    description: "Dynamic Island (6.1\")",
    popular: true,
  },
  {
    id: "iphone-15-pro-max",
    name: "iPhone 15 / 14 / 13 Pro Max",
    category: "mobile",
    width: 430,
    height: 932,
    description: "Large display (6.7\")",
  },
  {
    id: "iphone-13-mini",
    name: "iPhone 13 / 12 Mini",
    category: "mobile",
    width: 375,
    height: 812,
    description: "Compact iPhone (5.4\")",
  },
  {
    id: "iphone-se",
    name: "iPhone SE / 8",
    category: "mobile",
    width: 375,
    height: 667,
    description: "Classic home button form factor",
  },
  {
    id: "samsung-s24-ultra",
    name: "Samsung Galaxy S24 Ultra",
    category: "mobile",
    width: 412,
    height: 915,
    description: "Flagship Android smartphone",
    popular: true,
  },
  {
    id: "pixel-8-pro",
    name: "Google Pixel 8 / 7 Pro",
    category: "mobile",
    width: 412,
    height: 892,
    description: "Google Tensor flagship",
  },
];

export function getDefaultPreset(category: "desktop" | "tablet" | "mobile"): DevicePreset {
  switch (category) {
    case "tablet":
      return DEVICE_PRESETS.find((p) => p.id === "ipad-standard")!;
    case "mobile":
      return DEVICE_PRESETS.find((p) => p.id === "iphone-15-base")!;
    case "desktop":
    default:
      return DEVICE_PRESETS.find((p) => p.id === "desktop-standard")!;
  }
}

export function getPresetsByCategory(category: "desktop" | "tablet" | "mobile"): DevicePreset[] {
  return DEVICE_PRESETS.filter((p) => p.category === category);
}

export function getCategoryForWidth(width: number): "desktop" | "tablet" | "mobile" {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}
