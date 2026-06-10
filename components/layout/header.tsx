"use client";

import { CheckCircle2, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function Header() {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const { resolvedTheme, setTheme } = useTheme();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  const isDark = resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
          <span>TaskManager</span>
        </Link>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <Skeleton className="h-7 w-16 rounded-lg" />
          ) : isAuthenticated ? (
            <>
              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="hidden rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
                >
                  Admin
                </Link>
              )}
              <span className="hidden text-sm text-muted-foreground sm:inline-flex">
                {user?.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={logout}
              >
                Logout
              </Button>
            </>
          ) : null}

          {mounted ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? (
                <Sun className="size-4" aria-hidden="true" />
              ) : (
                <Moon className="size-4" aria-hidden="true" />
              )}
            </Button>
          ) : (
            <Skeleton className="size-8 rounded-lg" />
          )}
        </div>
      </div>
    </header>
  );
}
