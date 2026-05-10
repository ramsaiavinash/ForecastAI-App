import React, { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AlertDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextType | undefined>(undefined);

function useAlertDialog() {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error("useAlertDialog must be used within AlertDialog");
  }
  return context;
}

export function AlertDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogTrigger({
  children,
  asChild,
}: {
  children: ReactNode;
  asChild?: boolean;
}) {
  const { setOpen } = useAlertDialog();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => setOpen(true),
    } as any);
  }
  return <button onClick={() => setOpen(true)}>{children}</button>;
}

export function AlertDialogContent({ children }: { children: ReactNode }) {
  const { open, setOpen } = useAlertDialog();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 -translate-y-1/2 z-50 w-full max-w-lg" style={{ left: "50%", transform: "translate(-50%, -50%)", marginLeft: "0" }}
          >
            <div className="bg-white rounded-lg shadow-lg p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function AlertDialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

export function AlertDialogTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold text-slate-900">{children}</h2>;
}

export function AlertDialogDescription({
  children,
}: {
  children: ReactNode;
}) {
  return <p className="text-sm text-gray-600 mt-2">{children}</p>;
}

export function AlertDialogCancel({ children }: { children: ReactNode }) {
  const { setOpen } = useAlertDialog();
  return (
    <button
      onClick={() => setOpen(false)}
      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const { setOpen } = useAlertDialog();
  const handleClick = () => {
    onClick?.();
    setOpen(false);
  };
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        className || "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {children}
    </button>
  );
}