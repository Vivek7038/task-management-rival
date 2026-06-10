"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TaskFilters, TaskStatus } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  all: "All",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const SORT_LABELS: Record<string, string> = {
  created: "Date Created",
  due: "Due Date",
  priority: "Priority",
};

type Props = {
  filters: TaskFilters;
  onFiltersChange: (f: Partial<TaskFilters>) => void;
};

export function TaskToolbar({ filters, onFiltersChange }: Props) {
  const [localQ, setLocalQ] = useState(filters.q ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFiltersChange({ q: localQ || undefined, page: 1 });
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localQ]);

  const currentSort = filters.sort ?? "created";
  const currentDir = filters.dir ?? "desc";
  const currentStatus = filters.status ?? "all";

  function toggleDir() {
    onFiltersChange({ dir: currentDir === "asc" ? "desc" : "asc", page: 1 });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search tasks…"
          value={localQ}
          onChange={(e) => setLocalQ((e.target as HTMLInputElement).value)}
          className="pl-8"
        />
      </div>

      {/* Status filter */}
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button type="button" variant="outline" size="sm" className="min-w-28">
            {STATUS_LABELS[currentStatus]}
          </Button>
        } />
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(["all", "TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() =>
                  onFiltersChange({
                    status: s === "all" ? undefined : (s as TaskStatus),
                    page: 1,
                  })
                }
              >
                {STATUS_LABELS[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort field */}
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button type="button" variant="outline" size="sm" className="min-w-32">
            {SORT_LABELS[currentSort]}
          </Button>
        } />
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(["created", "due", "priority"] as const).map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => onFiltersChange({ sort: s, page: 1 })}
              >
                {SORT_LABELS[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort direction */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={toggleDir}
        title={currentDir === "asc" ? "Ascending" : "Descending"}
      >
        <ArrowUpDown className={currentDir === "asc" ? "rotate-180" : ""} />
      </Button>
    </div>
  );
}
