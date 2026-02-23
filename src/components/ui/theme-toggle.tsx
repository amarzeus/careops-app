"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

/**
 * Component to toggle between light and dark themes.
 * Uses next-themes to manage theme state.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="dark:hover:bg-background/10 relative h-10 w-10 overflow-hidden rounded-full hover:bg-black/5"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: 20, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -20, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center"
        >
          {theme === "dark" ? (
            <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500" />
          ) : (
            <Moon className="h-[1.2rem] w-[1.2rem] text-slate-700" />
          )}
        </motion.div>
      </AnimatePresence>
    </Button>
  );
}
