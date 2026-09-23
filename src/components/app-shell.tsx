import { Link, useRouterState } from "@tanstack/react-router";
import { Mail, Menu, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CompanionPanel } from "@/components/companion-panel";
import { AppOpenBeacon } from "@/components/app-open-beacon";
import { BrandMark } from "@/components/brand-mark";
import { LocationBeacon } from "@/components/location-beacon";
import { MessagesPanel } from "@/components/messages-panel";
import { Onboarding } from "@/components/onboarding";
import { VacationBanner, VacationToggle } from "@/components/vacation-control";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { AccountMenu } from "@/components/account-menu";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMe } from "@/lib/api";
import { EMPTY_ME, parseHouseTab } from "@/lib/house";
import { subscribeMe } from "@/lib/me-sync";
import { startLiveSync } from "@/lib/live-sync";
import { startCompanionLive } from "@/lib/companion-live";
import { HOUSE_NAV, NAV, navFor } from "@/lib/nav";
import type { Me } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const location = useRouterState({ select: (s) => s.location });
  const pathname = location.pathname;
  const hash = location.hash;
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [privateOpen, setPrivateOpen] = useState(false);
  const [privateTab, setPrivateTab] = useState<"messages" | "photos">("messages");
  const [companionOpen, setCompanionOpen] = useState(false);
  const companionOpenRef = useRef(false);
  companionOpenRef.current = companionOpen;
  const [companionPing, setCompanionPing] = useState(false);
  const [sessionTimedOut, setSessionTimedOut] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setSessionTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setSessionTimedOut(true), 2500);
    return () => window.clearTimeout(timer);
  }, [isPending]);

  useEffect(() => {
    if (user) return;
    setMe(null);
    setReady(!isPending || sessionTimedOut);
  }, [user, isPending, sessionTimedOut]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setReady(false);
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setMe((current) => current ?? EMPTY_ME);
      setReady(true);
    }, 8000);
    getMe()
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        if (!cancelled) setMe(EMPTY_ME);
      })
      .finally(() => {
        window.clearTimeout(timer);
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [user?.id]);

  useEffect(() => subscribeMe(setMe), []);

  useEffect(() => {
    if (!me?.profile) return;
    const stopLive = startLiveSync();
    const stopCompanion = startCompanionLive({ panelOpen: () => companionOpenRef.current });
    return () => {
      stopLive();
      stopCompanion();
    };
  }, [me?.profile?.userId, me?.profile?.bondId]);

  useEffect(() => {
    function onPing() {
      if (!companionOpenRef.current) setCompanionPing(true);
    }
    window.addEventListener("sanctum:companion-ping", onPing);
    return () => window.removeEventListener("sanctum:companion-ping", onPing);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
    setPrivateOpen(false);
  }, [pathname, hash]);

  useEffect(() => {
    setCompanionOpen(false);
  }, [pathname]);

  if ((isPending && !sessionTimedOut) || (Boolean(user) && !ready)) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background vignette px-6">
        <div className="text-center">
          <BrandMark className="mx-auto size-20" />
          <p className="mt-4 font-display text-4xl tracking-tight">Sanctum</p>
          <p className="mt-2 text-sm text-muted-foreground">Opening Sanctum</p>
        </div>
      </div>
    );
  }

  if (!user) return <RedirectToSignIn />;

  if (!me?.profile || !me.profile.setupDone) {
    return (
      <div className="min-h-dvh bg-background vignette px-5 py-12">
        <Onboarding userName={user.displayName} me={me} onDone={setMe} />
      </div>
    );
  }

  const quick = navFor(me.options.quickNav);
  const morePages = NAV.filter((item) => !quick.some((q) => q.to === item.to));

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-xl tracking-tight">
            <BrandMark className="size-8" />
            Sanctum
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="flex items-center rounded-full border border-border">
              <button
                type="button"
                onClick={() => {
                  setPrivateOpen(false);
                  setCompanionOpen((open) => !open);
                  setCompanionPing(false);
                }}
                className={cn(
                  "relative flex h-10 items-center gap-1.5 rounded-l-full px-3 text-sm",
                  companionOpen
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Companion"
              >
                <Sparkles className="size-4" />
                <span className="hidden sm:inline">Companion</span>
                {companionPing && !companionOpen ? (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCompanionOpen(false);
                  setPrivateTab("messages");
                  setPrivateOpen((open) => !(open && privateTab === "messages"));
                }}
                className={cn(
                  "flex h-10 items-center gap-1.5 border-l border-border px-3 text-sm",
                  privateOpen && privateTab === "messages"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Mail className="size-4" />
                <span className="hidden sm:inline">Messages</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCompanionOpen(false);
                  setPrivateTab("photos");
                  setPrivateOpen((open) => !(open && privateTab === "photos"));
                }}
                className={cn(
                  "flex h-10 items-center rounded-r-full px-3 text-sm",
                  privateOpen && privateTab === "photos"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Photos
              </button>
            </div>
            <Link
              to="/house"
              hash="you"
              className="ml-0.5 grid size-10 place-items-center overflow-hidden rounded-full border border-border"
              aria-label="Profile"
            >
              {me.profile.avatarData ? (
                <img src={me.profile.avatarData} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-sm">
                  {(me.profile.username || me.profile.displayName).charAt(0) || "S"}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <VacationBanner me={me} onChange={setMe} />
      <AppOpenBeacon />
      <LocationBeacon />
      <CompanionPanel me={me} open={companionOpen} onClose={() => setCompanionOpen(false)} />
      <MessagesPanel
        me={me}
        open={privateOpen}
        tab={privateTab}
        onTab={(tab) => {
          setPrivateTab(tab);
          setPrivateOpen(true);
        }}
      />
      {privateOpen || companionOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/40"
          aria-label="Close panel"
          onClick={() => {
            setPrivateOpen(false);
            setCompanionOpen(false);
          }}
        />
      ) : null}

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 pb-28 md:pb-10">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-24 flex max-h-[calc(100dvh-7rem)] flex-col">
            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            <VacationToggle me={me} onChange={setMe} compact />
            <p className="px-3 pb-1 pt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Settings
            </p>
            {HOUSE_NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === "/house" && parseHouseTab(hash) === item.hash;
              return (
                <Link
                  key={item.hash}
                  to="/house"
                  hash={item.hash}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-lg px-3 text-sm",
                    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            <p className="px-3 pb-1 pt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Categories
            </p>
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-11 items-center gap-2 rounded-lg px-3 text-sm",
                    pathname === item.to ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            </nav>
            <div className="mt-3 shrink-0 border-t border-border pt-3">
              <AccountMenu />
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {quick.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 text-[11px]",
              moreOpen ? "text-primary" : "text-muted-foreground",
            )}
          >
            {moreOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            More
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-x-0 bottom-16 z-30 max-h-[70dvh] overflow-y-auto border-t border-border bg-card p-3 md:hidden">
          <VacationToggle me={me} onChange={setMe} compact />
          <p className="px-1 pb-2 pt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Settings
          </p>
          <div className="grid grid-cols-2 gap-2">
            {HOUSE_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.hash}
                  to="/house"
                  hash={item.hash}
                  className="flex h-12 items-center gap-2 rounded-lg bg-secondary px-3 text-sm"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <p className="px-1 pb-2 pt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Categories
          </p>
          <div className="grid grid-cols-2 gap-2">
            {morePages.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex h-12 items-center gap-2 rounded-lg bg-secondary px-3 text-sm"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-3 px-1">
            <AccountMenu />
          </div>
        </div>
      ) : null}
    </div>
  );
}
