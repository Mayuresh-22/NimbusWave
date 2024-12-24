export interface NavbarLink {
  title: string;
  path: string;
  isIcon: boolean;
};

export const HOME: NavbarLink = {title: "Home", path: "/", isIcon: false}
export const DASHBOARD: NavbarLink = {title: "Dashboard", path: "/dashboard", isIcon: false}
export const PRICING: NavbarLink = {title: "Pricing", path: "/pricing", isIcon: false}
export const DOCS: NavbarLink = {title: "Docs", path: "/docs", isIcon: false}
export const AI_CHAT: NavbarLink = {title: "AI Chat", path: "/deploy", isIcon: false}
export const SETTINGS: NavbarLink = {title: "Settings", path: "/settings", isIcon: false}
export const ONBOARD: NavbarLink = {title: "Onboard", path: "/onboard", isIcon: false}

export const NAVBAR_LINKS: {[key: string]: NavbarLink[]} = {
  "/": [PRICING, DOCS],
  "/dashboard": [AI_CHAT, DOCS, SETTINGS],
  "/onboard": [PRICING, DOCS],
  "/deploy": [DOCS],
  "/docs": [DOCS],
  "/settings": [SETTINGS, DOCS],
}