import React, { useRef, useState, useEffect } from "react";

const UserProfilePopover = ({ user, children }) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);
  const [alignRight, setAlignRight] = useState(false);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function handleEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (open && popoverRef.current) {
      popoverRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = 260; // match w-64
    const spaceRight = window.innerWidth - rect.left;
    if (spaceRight < popoverWidth + 24) {
      setAlignRight(true);
    } else {
      setAlignRight(false);
    }
  }, [open]);

  const handleToggle = (e) => {
    e.stopPropagation();
    setOpen((v) => !v);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => !v);
    }
  };

  return (
    <span className="relative inline-block align-middle">
      <span
        ref={buttonRef}
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        {children}
      </span>
      {open && (
        <div
          ref={popoverRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          className={`absolute z-50 mt-2 max-w-xs w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 focus:outline-none ${alignRight ? 'right-0' : 'left-0'}`}
        >
          <div className="flex items-center gap-3 mb-2">
            {children}
            <div className="min-w-0 max-w-[180px] flex flex-col w-full">
              {user.name && (
                <div className="font-bold text-lg text-gray-900 dark:text-white leading-tight mb-0.5" title={user.name}>{user.name}</div>
              )}
              {user.email && (
                <div className="text-sm text-gray-500 leading-tight break-all" title={user.email}>{user.email}</div>
              )}
            </div>
          </div>
          <hr className="my-2 border-gray-200 dark:border-gray-700" />
          {user.role && (
            <div className="mb-2">
              <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">{user.role}</span>
            </div>
          )}
          <a
            href={`mailto:${user.email}`}
            className="text-blue-600 hover:underline text-xs"
            tabIndex={0}
          >
            Send Email
          </a>
        </div>
      )}
    </span>
  );
};

export default UserProfilePopover; 