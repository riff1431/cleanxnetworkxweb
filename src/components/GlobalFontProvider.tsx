import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const GOOGLE_FONTS_BASE = "https://fonts.googleapis.com/css2?family=";

interface ThemeSettings {
  global_font?: string;
  heading_font?: string;
  body_font?: string;
  heading_size_h1?: string;
  heading_size_h2?: string;
  heading_size_h3?: string;
  body_size?: string;
  small_text_size?: string;
  og_image?: string;
  favicon_url?: string;
  site_title?: string;
  site_description?: string;
  og_title?: string;
  og_description?: string;
}

const THEME_KEYS = [
  "global_font",
  "heading_font",
  "body_font",
  "heading_size_h1",
  "heading_size_h2",
  "heading_size_h3",
  "body_size",
  "small_text_size",
  "og_image",
  "favicon_url",
  "site_title",
  "site_description",
  "og_title",
  "og_description",
];

function loadGoogleFont(font: string, linkId: string) {
  const fontFamily = font.replace(/ /g, "+");
  let link = document.getElementById(linkId) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = `${GOOGLE_FONTS_BASE}${fontFamily}:wght@300;400;500;600;700;800&display=swap`;
}

const GlobalFontProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<ThemeSettings>({});

  useEffect(() => {
    supabase
      .from("theme_settings")
      .select("setting_key, setting_value")
      .in("setting_key", THEME_KEYS)
      .then(({ data }) => {
        if (data) {
          const map: ThemeSettings = {};
          data.forEach((row) => {
            if (row.setting_value) {
              (map as any)[row.setting_key] = row.setting_value;
            }
          });
          setSettings(map);
        }
      });
  }, []);

  useEffect(() => {
    const { global_font, heading_font, body_font, heading_size_h1, heading_size_h2, heading_size_h3, body_size, small_text_size } = settings;

    // Resolve fonts: specific overrides global
    const resolvedHeading = heading_font || global_font;
    const resolvedBody = body_font || global_font;

    if (resolvedHeading) {
      loadGoogleFont(resolvedHeading, "dynamic-heading-font");
      document.documentElement.style.setProperty("--font-heading", `"${resolvedHeading}", sans-serif`);
    }
    if (resolvedBody) {
      loadGoogleFont(resolvedBody, "dynamic-body-font");
      document.documentElement.style.setProperty("--font-sans", `"${resolvedBody}", sans-serif`);
    }

    // Apply font sizes via CSS custom properties
    const styleId = "dynamic-typography-styles";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      ${heading_size_h1 ? `h1 { font-size: ${heading_size_h1}px !important; }` : ""}
      ${heading_size_h2 ? `h2 { font-size: ${heading_size_h2}px !important; }` : ""}
      ${heading_size_h3 ? `h3, h4, h5, h6 { font-size: ${heading_size_h3}px !important; }` : ""}
      ${body_size ? `p, span, div, li, td, th, label, a { font-size: ${body_size}px; }` : ""}
      ${small_text_size ? `.text-xs, .text-sm, small, caption { font-size: ${small_text_size}px !important; }` : ""}
      ${resolvedHeading ? `h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); }` : ""}
      ${resolvedBody ? `body, p, span, div, li, td, th, label, a, input, textarea, select, button { font-family: var(--font-sans); }` : ""}
    `;
  }, [settings]);

  // Dynamically update meta tags (title, description, OG)
  useEffect(() => {
    const updateMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector) as HTMLMetaElement | null;
      if (el) el.setAttribute(attr, value);
    };

    if (settings.site_title) {
      document.title = settings.site_title;
    }
    if (settings.site_description) {
      updateMeta('meta[name="description"]', 'content', settings.site_description);
    }
    if (settings.og_title) {
      updateMeta('meta[property="og:title"]', 'content', settings.og_title);
    }
    if (settings.og_description) {
      updateMeta('meta[property="og:description"]', 'content', settings.og_description);
    }
    if (settings.og_image) {
      updateMeta('meta[property="og:image"]', 'content', settings.og_image);
      updateMeta('meta[name="twitter:image"]', 'content', settings.og_image);
    }
    if (settings.favicon_url) {
      let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.favicon_url;
      link.type = "image/png";
    }
  }, [settings.site_title, settings.site_description, settings.og_title, settings.og_description, settings.og_image, settings.favicon_url]);

  return <>{children}</>;
};

export default GlobalFontProvider;
