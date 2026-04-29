import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Sprout,
  ArrowLeftRight,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const navigationGroups = [
    {
      label: "Overview",
      items: [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
      ],
    },
    {
      label: "Inventory",
      items: [
        { name: "Seed Inventory", href: "/inventory", icon: Package },
        { name: "Register Batch", href: "/inventory/new", icon: PlusCircle },
      ],
    },
    {
      label: "Operations",
      items: [
        { name: "Stock Movements", href: "/movements", icon: ArrowLeftRight },
        { name: "Analytics", href: "/analytics", icon: BarChart3 },
      ],
    },
  ];

  return (
    <div className="flex h-full w-[260px] flex-col bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border z-20">
      <div className="flex h-16 shrink-0 items-center px-6 font-semibold">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Sprout className="h-4 w-4" />
          </div>
          <span className="text-[16px] font-semibold text-sidebar-foreground tracking-tight">
            SeedTrack Pro
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto pt-4 pb-4">
        <nav className="flex-1 space-y-6 px-3">
          {navigationGroups.map((group) => (
            <div key={group.label}>
              <div className="px-2 mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
                  {group.label}
                </p>
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? location === "/"
                      : location.startsWith(item.href);

                  return (
                    <Link key={item.name} href={item.href}>
                      <div
                        className={cn(
                          "group flex items-center rounded-xl px-3 py-2 text-[14px] font-medium transition-all duration-200 cursor-pointer",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm shadow-black/5 dark:shadow-white/5"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "mr-3 h-4 w-4 shrink-0 transition-colors",
                            isActive
                              ? "text-primary"
                              : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70",
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="p-4 mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-sidebar-accent/50 transition-colors cursor-pointer border border-transparent hover:border-border/50">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary ring-1 ring-primary/20">
            OP
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold leading-none text-sidebar-foreground">
              Operations
            </span>
            <span className="text-[11px] text-sidebar-foreground/50 mt-1.5 font-medium tracking-wide">
              v2.0.0 • Production
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
