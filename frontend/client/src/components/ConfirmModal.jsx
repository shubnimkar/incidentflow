import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import React from "react";

const ConfirmModal = ({ open, onClose, onConfirm, title, description }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed z-50 top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{description}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
            >
              Confirm
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ConfirmModal;
