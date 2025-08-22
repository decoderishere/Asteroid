import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const AlertDialogContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const AlertDialog = ({ open: controlledOpen, onOpenChange, children }: AlertDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0" 
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-lg w-full">
            {children}
          </div>
        </div>
      )}
    </AlertDialogContext.Provider>
  );
};

interface AlertDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

const AlertDialogContent = ({ children, className }: AlertDialogContentProps) => {
  const { open } = useContext(AlertDialogContext);
  
  if (!open) return null;

  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  );
};

interface AlertDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const AlertDialogHeader = ({ children, className }: AlertDialogHeaderProps) => {
  return (
    <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)}>
      {children}
    </div>
  );
};

interface AlertDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

const AlertDialogTitle = ({ children, className }: AlertDialogTitleProps) => {
  return (
    <h2 className={cn('text-lg font-semibold', className)}>
      {children}
    </h2>
  );
};

interface AlertDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const AlertDialogDescription = ({ children, className }: AlertDialogDescriptionProps) => {
  return (
    <p className={cn('text-sm text-gray-600 dark:text-gray-400', className)}>
      {children}
    </p>
  );
};

interface AlertDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

const AlertDialogFooter = ({ children, className }: AlertDialogFooterProps) => {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6', className)}>
      {children}
    </div>
  );
};

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AlertDialogAction = ({ className, ...props }: AlertDialogActionProps) => {
  const { setOpen } = useContext(AlertDialogContext);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e);
    setOpen(false);
  };

  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white ring-offset-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      onClick={handleClick}
      {...props}
    />
  );
};

interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AlertDialogCancel = ({ className, ...props }: AlertDialogCancelProps) => {
  const { setOpen } = useContext(AlertDialogContext);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e);
    setOpen(false);
  };

  return (
    <button
      className={cn(
        'mt-2 inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-offset-white transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:mt-0',
        className
      )}
      onClick={handleClick}
      {...props}
    />
  );
};

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
};