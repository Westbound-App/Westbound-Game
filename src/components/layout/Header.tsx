"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Show" },
  { href: "/journey", label: "Journey" },
  { href: "/leaderboards", label: "Boards" },
  { href: "/account", label: "Account" },
  { href: "/how-it-works", label: "How" },
  { href: "/admin/game-debug", label: "Debug" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--color-asphalt)]/40 bg-[var(--color-navy)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex shrink-0 flex-col">
          <span className="font-semibold tracking-[0.2em] text-[var(--color-cream)]">
            WESTBOUND
          </span>
          <span className="text-xs text-[var(--color-tan)] group-hover:text-[var(--color-gold)]">
            He is walking west
          </span>
        </Link>
        <nav
          aria-label="Primary"
          className="-mx-1 flex max-w-[65%] items-center gap-0.5 overflow-x-auto sm:max-w-none sm:gap-1"
        >
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-md px-2 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)] sm:px-2.5 ${
                  active
                    ? "bg-white/10 text-[var(--color-gold)]"
                    : "text-[var(--color-cream)]/90 hover:bg-white/5 hover:text-[var(--color-gold)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
