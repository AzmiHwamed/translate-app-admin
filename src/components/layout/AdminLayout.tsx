import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";

const NAV_ITEMS = [
  { label: "Dashboard Overview", path: "/" },
  { label: "Payment Plans", path: "/plans" },
  { label: "Currencies", path: "/currencies" },
  { label: "FAQs", path: "/faqs" },
  { label: "Customer Service", path: "/chat" },
];

export function AdminLayout() {
  const user = useAppSelector((state) => state.auth.user);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isStuck, setIsStuck] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Close the mobile menu automatically if the viewport grows past the lg breakpoint
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsMobileMenuOpen(false);
    };
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return (
    <div className="admin-layout">
      <div className="admin-layout__main">
        {/* ===== Hero header ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-900 to-slate-800 px-6 pb-10 pt-6 text-white lg:px-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 20%, rgba(56,189,248,0.25), transparent 40%), radial-gradient(circle at 85% 0%, rgba(45,212,191,0.22), transparent 45%)",
            }}
          />

          <div className="relative z-20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="src\assets\image.png" className="w-20" />
              <span className="text-lg font-semibold tracking-tight">Translate App</span>
            </div>

            <div className="hidden max-w-md flex-1 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/70 backdrop-blur md:flex">
              <span aria-hidden>🔍</span>
              <input
                placeholder="Search something..."
                className="w-full bg-transparent outline-none placeholder:text-white/50"
              />
            </div>

            <div className="flex items-center gap-3">
              <HeaderIconButton icon="🔔" label="Notifications" />
              <HeaderIconButton icon="💬" label="Messages" />
              <HeaderIconButton icon="🎯" label="Activity" />
              <div className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                  {(user?.displayName ?? "A").charAt(0).toUpperCase()}
                </div>
                <div className="text-left text-xs leading-tight">
                  <div className="font-semibold">{user?.displayName ?? "Admin"}</div>
                  <div className="text-white/60">Admin</div>
                </div>
              </div>

              {/* Hamburger — mobile only, hidden once the desktop nav takes over at lg */}
              <button
                type="button"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm transition-colors hover:bg-white/20 lg:hidden"
              >
                {isMobileMenuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>

          <div className="relative z-20 mt-8">
            <h1 className="m-0 text-3xl font-bold">Hello, {user?.displayName ?? "Admin"}!!</h1>
            <p className="m-0 mt-1 text-sm text-white/70">Welcome back again, let&apos;s get back to work.</p>
          </div>

          {/* ===== Mobile nav overlay — sits on top of the hero only, clipped to it, lg:hidden ===== */}
          {isMobileMenuOpen && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-slate-900 lg:hidden">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    isActive
                      ? "text-base font-semibold text-white"
                      : "text-base text-white/60 transition-colors hover:text-white"
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Sentinel: sits right before the nav. When it scrolls out of view,
            the nav below it has "docked" to the top. */}
        <div ref={sentinelRef} className="h-px" />

        {/* ===== Sticky nav — desktop only, same gradient family as the hero so they blend ===== */}
        <nav
          className={`sticky top-0 z-30 hidden flex-wrap gap-6 overflow-x-auto bg-gradient-to-tl from-slate-900 via-teal-900 to-slate-800 px-6 text-sm text-white transition-all duration-300 ease-out lg:flex lg:px-10 ${
            isStuck ? "py-3 shadow-lg shadow-black/20" : "py-3"
          }`}
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                isActive
                  ? "shrink-0 border-b-2 border-white pb-1 font-medium text-white transition-all duration-300"
                  : "shrink-0 border-b-2 border-transparent pb-1 text-white/60 transition-all duration-300 hover:text-white"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="admin-layout__content relative -mt-10 px-6 pb-10 lg:px-10">
          <div className="h-10"></div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function HeaderIconButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm transition-colors hover:bg-white/20"
    >
      {icon}
    </button>
  );
}
