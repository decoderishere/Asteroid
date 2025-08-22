import React, { createContext, useContext, useState, forwardRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const SelectContext = createContext<{
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  value: '',
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
});

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Select = ({ value = '', onValueChange = () => {}, children }: SelectProps) => {
  const [open, setOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useContext(SelectContext);

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

interface SelectValueProps {
  placeholder?: string;
}

const SelectValue = ({ placeholder }: SelectValueProps) => {
  const { value } = useContext(SelectContext);
  
  return (
    <span className={cn(!value && 'text-gray-500')}>
      {value || placeholder}
    </span>
  );
};

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

const SelectContent = ({ children, className }: SelectContentProps) => {
  const { open } = useContext(SelectContext);

  if (!open) return null;

  return (
    <div className={cn(
      'absolute top-full left-0 z-50 w-full min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-md animate-in fade-in-0 zoom-in-95 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50',
      className
    )}>
      {children}
    </div>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const SelectItem = ({ value, children, className }: SelectItemProps) => {
  const { value: selectedValue, onValueChange, setOpen } = useContext(SelectContext);
  const isSelected = selectedValue === value;

  const handleSelect = () => {
    onValueChange(value);
    setOpen(false);
  };

  return (
    <div
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800',
        isSelected && 'bg-gray-100 dark:bg-gray-800',
        className
      )}
      onClick={handleSelect}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };