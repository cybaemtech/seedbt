import * as React from "react";
import { useListAssets, getListAssetsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Search, Package, MapPin } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function GlobalSearch({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [, setLocation] = useLocation();
  const { data: assets } = useListAssets({ query: { enabled: open, queryKey: getListAssetsQueryKey() } });

  const runCommand = React.useCallback((command: () => unknown) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." className="h-14 text-[15px]" />
      <CommandList className="max-h-[400px] p-2">
        <CommandEmpty className="py-12 text-center text-[15px] font-medium text-muted-foreground">No results found.</CommandEmpty>
        
        {assets && assets.length > 0 && (
          <CommandGroup heading="Assets" className="text-muted-foreground font-semibold px-2 py-3">
            {assets.map((asset) => (
              <CommandItem
                key={asset.id}
                value={`${asset.seedName} ${asset.batchNumber} ${asset.location}`}
                onSelect={() => runCommand(() => setLocation(`/inventory/${asset.id}`))}
                className="flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer aria-selected:bg-muted/60"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] text-foreground">{asset.seedName}</span>
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground mt-0.5 font-medium">
                    <span className="font-mono bg-muted/60 px-1.5 py-0.5 rounded text-[11px]">{asset.batchNumber}</span>
                    <span>&bull;</span>
                    <span className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1 inline text-muted-foreground/70" />{asset.location}</span>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        <CommandGroup heading="Actions" className="text-muted-foreground font-semibold px-2 py-3">
          <CommandItem onSelect={() => runCommand(() => setLocation('/inventory/new'))} className="flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer aria-selected:bg-muted/60">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
               <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="font-semibold text-[15px]">Add new asset</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
