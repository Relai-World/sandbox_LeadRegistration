import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface AutocompleteProps {
  value: string
  onValueChange: (value: string) => void
  options: string[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  error?: boolean
}

export function Autocomplete({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  className,
  error = false,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options.slice(0, 100)
    return options
      .filter((option) =>
        option.toLowerCase().includes(searchValue.toLowerCase())
      )
      .slice(0, 100)
  }, [options, searchValue])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue) {
      // Find exact match from options (case-insensitive search)
      const exactMatch = options.find(opt => 
        opt.toLowerCase() === searchValue.toLowerCase()
      );
      // Use exact match if found, otherwise use the search value
      onValueChange(exactMatch || searchValue)
      setOpen(false)
      setSearchValue("")
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && searchValue) {
      // Find exact match from options (case-insensitive search)
      const exactMatch = options.find(opt => 
        opt.toLowerCase() === searchValue.toLowerCase()
      );
      // Use exact match if found, otherwise use the search value
      onValueChange(exactMatch || searchValue)
      setSearchValue("")
    }
    setOpen(newOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            error && "border-red-500",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>
              {searchValue ? (
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground">{emptyMessage}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">Enter</kbd> to use "{searchValue}"
                  </p>
                </div>
              ) : (
                emptyMessage
              )}
            </CommandEmpty>
            <CommandGroup className="max-h-[400px] overflow-auto">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                    setSearchValue("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
