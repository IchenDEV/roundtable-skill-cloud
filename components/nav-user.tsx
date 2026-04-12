"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function NavUser({ email }: { email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const short = email.length > 22 ? `${email.slice(0, 10)}…${email.slice(-8)}` : email;

  const signOut = async () => {
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut({ scope: "global" });
    router.refresh();
    setBusy(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={busy}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "h-9 max-w-[14rem] gap-1 rounded-xl bg-card px-2 font-sans text-ink-800 ring-border transition-[transform,box-shadow] duration-150 hover:bg-paper-100 data-[popup-open]:scale-[0.98] data-[popup-open]:shadow-inner"
        )}
      >
        <UserRound className="size-4 shrink-0 text-ink-600" aria-hidden />
        <span className="truncate text-xs">{short}</span>
        <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem] font-sans">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-xs text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
          <LogOut className="size-4" />
          登出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
