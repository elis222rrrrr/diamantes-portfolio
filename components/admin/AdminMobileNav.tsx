"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

type NavGroup = {
  label: string | null;
  items: { label: string; href: string }[];
};

type Props = {
  navGroups: NavGroup[];
  userLabel: string;
  userRole: string;
  logout: () => void | Promise<void>;
};

/**
 * The admin sidebar (AdminShell.tsx) is `hidden` below `lg` with nothing to
 * replace it — below 1024px there was no way to reach any other admin page
 * except editing the URL by hand (found during a responsiveness audit).
 * This is that replacement: a top bar + fullscreen drawer, same interaction
 * pattern as the public site's own mobile menu (components/Nav.tsx) — a
 * `fixed inset-0` overlay with a focus trap, not a squeezed-down sidebar.
 */
export default function AdminMobileNav({ navGroups, userLabel, userRole, logout }: Props) {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setOpen(false), []);

  useFocusTrap(open, overlayRef, closeMenu);

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <p className="tracked-label text-muted">Diamantes 3Designs</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Open menu"
          className="focus-ring p-2 text-white/70 transition hover:text-white"
        >
          <Menu size={20} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-black text-white"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <p className="tracked-label text-muted">Diamantes 3Designs</p>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                className="focus-ring p-2 text-white/70 transition hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-6 py-8">
              <div className="flex flex-col gap-8">
                {navGroups.map((group) => (
                  <div key={group.label ?? "root"}>
                    {group.label && <p className="tracked-label mb-3 text-muted">{group.label}</p>}
                    <div className="flex flex-col gap-4">
                      {group.items.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={closeMenu}
                          className="focus-ring text-lg text-white/80 transition hover:text-white"
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </nav>

            <div className="border-t border-white/10 px-6 py-6">
              <p className="text-sm">{userLabel}</p>
              <p className="tracked-label mb-4 text-muted">{userRole}</p>
              <form action={logout}>
                <button
                  type="submit"
                  className="focus-ring tracked-label text-muted transition hover:text-white"
                >
                  Sign out
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
