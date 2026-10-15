"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, X, MapPin, Shield } from "lucide-react";
import { signOut } from "next-auth/react";

import type { Role } from "@/types/roles";
import { ROLE_LABELS } from "@/types/roles";

import { getNavItems } from "./nav-items";

type MobileSidebarProps = {
  role: Role;
  centreName?: string;
  isOpen: boolean;
  onClose: () => void;
};

export function MobileSidebar({
  role,
  centreName,
  isOpen,
  onClose,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const navBarItems = getNavItems(role);
  const [mounted, setMounted] = useState(false);

  // Mount check for createPortal (SSR safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close only when pathname actually changes (not on initial render)
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (isOpen) {
        onClose();
      }
    }
  }, [pathname, isOpen, onClose]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[9998] md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <aside
        className="fixed inset-y-0 left-0 z-[9999] flex w-72 max-w-[85vw] flex-col bg-[#1a1a1a] shadow-2xl transition-transform duration-250 ease-out"
        style={{
          transform: "translateX(0)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)",
        }}
        aria-label="Menu principal de navigation"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h1 className="text-[#f7931e] text-lg font-bold tracking-tight">
              EXCELIS PRÉPAS
            </h1>
            <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase">
              ERP Gesprepas
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white active:scale-95"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User / Role info badge */}
        <div className="border-b border-white/10 bg-white/[0.04] px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f7931e]/20 text-[#f7931e]">
              <Shield size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {ROLE_LABELS[role]}
              </p>
              {centreName && (
                <p className="flex items-center gap-1 text-[11px] text-white/60 truncate">
                  <MapPin size={11} className="shrink-0 text-[#f7931e]" />
                  <span className="truncate">{centreName}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation links list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navBarItems.map(({ href, label, icon: Icon }) => {
            const actif =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                  actif
                    ? "bg-[#f7931e] text-white shadow-md shadow-[#f7931e]/20"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={19} strokeWidth={2} className="shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer with Logout */}
        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-sm font-bold text-white/80 transition-all hover:bg-rose-500/20 hover:text-rose-300 active:scale-98"
          >
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </div>
  );

  return createPortal(content, document.body);
}
