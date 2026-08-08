"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCompanion } from "@/store/companion";
import { useApplySettings } from "@/lib/use-apply-settings";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { HomeScreen } from "@/screens/HomeScreen";
import { ChatsScreen } from "@/screens/ChatsScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";

export function Dashboard() {
  useApplySettings();
  const route = useCompanion((s) => s.route);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-base text-ink-primary">
      <Sidebar />
      <main className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {route === "home" && <HomeScreen />}
            {route === "chats" && <ChatsScreen />}
            {route === "settings" && <SettingsScreen />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
