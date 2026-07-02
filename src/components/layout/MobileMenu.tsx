"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  loggedIn: boolean;
}

export function MobileMenu({ open, onClose, loggedIn }: MobileMenuProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-64 bg-neutral-950 border-l border-white/10 p-6 md:hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white"
              aria-label="关闭菜单"
            >
              <X size={24} />
            </button>

            <nav className="mt-16 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-3 rounded-xl text-base transition-colors",
                    pathname === link.href
                      ? "text-white bg-white/10"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  onClick={onClose}
                >
                  {link.label}
                </Link>
              ))}

              {/* 控制台（仅登录可见） */}
              {loggedIn && (
                <Link
                  href="/admin"
                  className="mt-2 flex items-center gap-2 px-4 py-3 rounded-xl text-base text-orange-400 border border-orange-400/20 hover:bg-orange-400/10 transition-colors"
                  onClick={onClose}
                >
                  <LayoutDashboard size={18} />
                  控制台
                </Link>
              )}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
