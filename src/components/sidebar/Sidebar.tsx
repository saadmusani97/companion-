"use client";

import { motion } from "framer-motion";
import { useCompanion } from "@/store/companion";
import { HomeIcon, ChatIcon, SettingsIcon, SparkIcon } from "@/components/icons";
import type { Route } from "@/lib/types";
import type { ComponentType, SVGProps } from "react";

interface NavItem {
  route: Route;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV: NavItem[] = [
  { route: "home", label: "Home", icon: HomeIcon },
  { route: "chats", label: "Chats", icon: ChatIcon },
  { route: "settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar() {
  const route = useCompanion((s) => s.route);
  const setRoute = useCompanion((s) => s.setRoute);

  return (
    <aside className="flex h-full w-[76px] shrink-0 flex-col items-center justify-between border-r border-line-subtle bg-bg-surface/40 py-6 backdrop-blur-xl">
      {/* Brand */}
      <div className="grid h-11 w-11 place-items-center rounded-2xl border border-line-subtle bg-bg-elevated">
        <motion.span
          className="text-accent"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
        >
          <SparkIcon className="h-5 w-5" />
        </motion.span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-2">
        {NAV.map((item) => {
          const active = route === item.route;
          const Icon = item.icon;
          return (
            <button
              key={item.route}
              onClick={() => setRoute(item.route)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="group relative grid h-12 w-12 place-items-center rounded-2xl transition-colors duration-300"
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-2xl border border-line-strong bg-white/[0.04]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              {active && (
                <motion.span
                  layoutId="sidebar-bar"
                  className="absolute -left-[18px] h-6 w-[3px] rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon
                className={`relative h-5 w-5 transition-colors duration-300 ${
                  active ? "text-accent" : "text-ink-secondary group-hover:text-ink-primary"
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Status dot */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
        <span className="text-[10px] font-medium tracking-wide text-ink-tertiary">v0.1</span>
      </div>
    </aside>
  );
}
