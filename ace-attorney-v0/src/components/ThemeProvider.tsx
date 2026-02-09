"use client";

import { useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    async function loadTheme() {
      // Check localStorage first for instant apply
      const cached = localStorage.getItem("ace_theme");
      if (cached === "light") {
        document.documentElement.classList.add("light");
      }

      // Then check Supabase for the canonical value
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("theme")
          .eq("id", user.id)
          .single();

        if (data) {
          const theme = (data as { theme: string }).theme;
          localStorage.setItem("ace_theme", theme);
          if (theme === "light") {
            document.documentElement.classList.add("light");
          } else {
            document.documentElement.classList.remove("light");
          }
        }
      }
    }
    loadTheme();
  }, []);

  return <>{children}</>;
}
