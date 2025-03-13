import { X } from "lucide-react";

export default function DeleteConfirmDialog({
  title,
  content,
  onOk,
  onClose,
}: {
  title: string;
  content: string;
  onOk: () => void;
  onClose: () => void;
}) {
  return (
    <div className="w-full h-full fixed top-0 left-0 bg-black bg-opacity-60 backdrop-blur-sm z-50">
      <div className="flex w-96 h-44 items-center justify-center bg-gray-900 border border-gray-800 rounded-lg fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div>
          <div className="w-full flex items-center justify-between px-4">
            <h1 className="text-xl font-bold">{title}</h1>
            <button
              className="hover:bg-gray-600 rounded-full p-1 text-xl font-bold"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
          <div className="w-full p-4">
            <p>{content}</p>
          </div>
          <div className="w-full flex items-center justify-end px-4 space-x-5">
            <button
              className="text-lg font-semibold px-4 py-1 bg-slate-600 rounded-lg"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="text-lg font-semibold px-4 py-1 bg-red-500 rounded-lg"
              onClick={onOk}
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
