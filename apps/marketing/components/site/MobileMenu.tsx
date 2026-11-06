"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Container } from "@/components/ui/Container";

interface MenuLink {
  href: string;
  label: string;
}

interface MobileMenuProps {
  labels: {
    open: string;
    close: string;
    /** Accessible name of the list of section links. */
    sections: string;
  };
  links: readonly MenuLink[];
  /** Extra controls shown under the links: language switcher, app button. */
  children: ReactNode;
}

/** The header shows its links inline from this width up (Tailwind `lg`). */
const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * The small-screen menu: a button in the header bar that opens a panel with
 * the section links. Escape closes it and returns focus to the button;
 * choosing a link or tapping outside closes it too.
 *
 * The panel is positioned against the sticky header, its nearest positioned
 * ancestor, so it spans the full width just below the bar.
 */
export function MobileMenu({ labels, links, children }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onDesktopChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    desktop.addEventListener("change", onDesktopChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      desktop.removeEventListener("change", onDesktopChange);
    };
  }, [open]);

  const closeWhenLinkChosen = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
  };

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? labels.close : labels.open}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className="inline-flex size-11 items-center justify-center rounded-full border-3 border-plum bg-paper text-plum transition-colors hover:bg-sun"
      >
        {open ? (
          <X aria-hidden="true" size={22} strokeWidth={3} />
        ) : (
          <Menu aria-hidden="true" size={22} strokeWidth={3} />
        )}
      </button>

      <div
        id={panelId}
        ref={panelRef}
        hidden={!open}
        onClick={closeWhenLinkChosen}
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-b-3 border-plum bg-sky"
      >
        <Container className="grid gap-4 pb-5 pt-3">
          <nav aria-label={labels.sections}>
            <ul className="grid gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="flex min-h-12 items-center rounded-2xl px-3 font-display text-[1.25rem] font-bold text-plum no-underline transition-colors hover:bg-paper"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-wrap items-center gap-3 border-t-[2.5px] border-dashed border-plum pt-4">
            {children}
          </div>
        </Container>
      </div>
    </div>
  );
}
