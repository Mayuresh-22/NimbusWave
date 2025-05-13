import * as Toast from "@radix-ui/react-toast"; // Use namespace import to ensure all components are correctly imported
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface ToastProps {
  title?: string;
  message: string;
}

const ToastComponent = ({ title, message }: ToastProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (message) {
      setOpen(true);
    }
  }, [message]);

  return (
    <Toast.Provider swipeDirection="right">
      <Toast.Root
        open={open}
        onOpenChange={setOpen}
        className="bg-gray-900 text-white p-4 rounded-lg shadow-lg"
      >
        <div className="flex items-center justify-between">
          {title && (
            <Toast.Title className="font-bold text-lg">{title}</Toast.Title>
          )}
          <Toast.Action asChild altText="Close">
            <button
              onClick={() => setOpen(false)}
              className="px-1 py-1 bg-red-500 border border-red-800 text-red-950 rounded-full hover:bg-red-600"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </Toast.Action>
        </div>
        <Toast.Description className="mt-2 text-sm">
          {message}
        </Toast.Description>
      </Toast.Root>
      <Toast.Viewport className="fixed bottom-10 right-10 flex flex-col gap-2 w-96 max-w-full z-50" />
    </Toast.Provider>
  );
};

export default ToastComponent;
