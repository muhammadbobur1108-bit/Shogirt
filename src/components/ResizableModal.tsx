import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, Move } from 'lucide-react';

interface ResizableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  theme?: 'dark' | 'light';
  children: React.ReactNode;
  initialWidth?: number; // e.g. 700
  initialHeight?: number; // e.g. 600
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  headerRightContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  zIndex?: number;
}

export const ResizableModal: React.FC<ResizableModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  theme = 'dark',
  children,
  initialWidth = 720,
  initialHeight = 620,
  minWidth = 360,
  minHeight = 300,
  maxWidth,
  maxHeight,
  className = '',
  headerRightContent,
  footerContent,
  zIndex = 50,
}) => {
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: initialWidth,
    height: initialHeight,
  });

  const [isMaximized, setIsMaximized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'se' | 'e' | 's' | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: initialWidth,
    h: initialHeight,
  });

  // Calculate viewport constraints
  const getEffectiveMaxWidth = () => maxWidth || (typeof window !== 'undefined' ? window.innerWidth - 32 : 1200);
  const getEffectiveMaxHeight = () => maxHeight || (typeof window !== 'undefined' ? window.innerHeight - 32 : 900);

  // Set default initial sizes on mount or when opening
  useEffect(() => {
    if (isOpen) {
      const calcW = Math.min(initialWidth, getEffectiveMaxWidth());
      const calcH = Math.min(initialHeight, getEffectiveMaxHeight());
      setSize({ width: calcW, height: calcH });
      setIsMaximized(false);
    }
  }, [isOpen, initialWidth, initialHeight]);

  // Start resize drag
  const handleMouseDownResize = (e: React.MouseEvent, dir: 'se' | 'e' | 's') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(dir);

    const currentW = modalRef.current ? modalRef.current.offsetWidth : size.width;
    const currentH = modalRef.current ? modalRef.current.offsetHeight : size.height;

    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: currentW,
      h: currentH,
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeDirection) return;

      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;

      const maxW = getEffectiveMaxWidth();
      const maxH = getEffectiveMaxHeight();

      setSize((prev) => {
        let newW = prev.width;
        let newH = prev.height;

        if (resizeDirection === 'se' || resizeDirection === 'e') {
          newW = Math.max(minWidth, Math.min(maxW, startPosRef.current.w + dx));
        }
        if (resizeDirection === 'se' || resizeDirection === 's') {
          newH = Math.max(minHeight, Math.min(maxH, startPosRef.current.h + dy));
        }

        return { width: newW, height: newH };
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, minWidth, minHeight]);

  if (!isOpen) return null;

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in select-none-if-resizing"
      style={{ zIndex }}
      onClick={(e) => {
        // Close if backdrop clicked
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        style={
          isMaximized
            ? { width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh', borderRadius: 0 }
            : {
                width: `${size.width}px`,
                height: `${size.height}px`,
                maxWidth: '98vw',
                maxHeight: '96vh',
              }
        }
        className={`${
          theme === 'light'
            ? 'bg-white border border-gray-300 text-gray-900'
            : 'bg-[#111827] border border-slate-700/80 text-white'
        } rounded-2xl shadow-2xl flex flex-col relative overflow-hidden transition-all duration-75 ${
          isResizing ? 'select-none pointer-events-auto' : ''
        } ${className}`}
      >
        {/* Header Bar */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 cursor-default ${
          theme === 'light'
            ? 'bg-gray-100 border-gray-300 text-gray-900'
            : 'bg-slate-900/90 border-slate-800 text-white'
        }`}>
          <div className="flex-1 pr-4 min-w-0 flex items-center gap-2">
            {icon && <div className="shrink-0">{icon}</div>}
            <div className="min-w-0">
              {typeof title === 'string' ? (
                <h3 className={`text-sm sm:text-base font-black uppercase tracking-tight truncate ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  {title}
                </h3>
              ) : (
                title
              )}
              {subtitle && (
                <p className={`text-xs mt-0.5 truncate ${theme === 'light' ? 'text-gray-500' : 'text-slate-400'}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerRightContent}

            {/* Maximize / Restore button */}
            <button
              type="button"
              onClick={toggleMaximize}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                theme === 'light' 
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isMaximized ? "Oyna hajmini tiklash" : "Oynani kattalashtirish"}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg text-base font-black transition-colors cursor-pointer ${
                theme === 'light' 
                  ? 'text-gray-600 hover:text-rose-600 hover:bg-gray-200' 
                  : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
              }`}
              title="Yopish"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className={`flex-1 overflow-y-auto p-5 text-xs custom-scrollbar ${
          theme === 'light' ? 'text-gray-800' : 'text-slate-300'
        }`}>
          {children}
        </div>

        {/* Optional Footer */}
        {footerContent && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/80 shrink-0 flex items-center justify-between">
            {footerContent}
          </div>
        )}

        {/* RESIZE HANDLES (Bottom, Right, Bottom-Right Corner) */}
        {!isMaximized && (
          <>
            {/* Right edge resize handle */}
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 'e')}
              className="absolute top-0 right-0 w-2 h-full cursor-e-resize hover:bg-indigo-500/30 transition-colors z-20"
              title="Enini o'zgartirish uchun torting"
            />

            {/* Bottom edge resize handle */}
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 's')}
              className="absolute bottom-0 left-0 w-full h-2 cursor-s-resize hover:bg-indigo-500/30 transition-colors z-20"
              title="Bo'yini o'zgartirish uchun torting"
            />

            {/* Bottom-Right corner resize handle with visual grip indicator */}
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 'se')}
              className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 z-30 group hover:bg-indigo-500/40 rounded-tl-lg transition-colors"
              title="Sichqoncha bilan ushlab kattalashtirish yoki kichiklashtirish uchun torting"
            >
              <div className="w-3.5 h-3.5 border-r-2 border-b-2 border-slate-400 group-hover:border-indigo-300 transition-colors opacity-70 group-hover:opacity-100" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
