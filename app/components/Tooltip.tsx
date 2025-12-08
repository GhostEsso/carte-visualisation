'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactElement;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

const Tooltip = ({ content, children, position = 'top', delay = 200 }: TooltipProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const show = () => {
        timeoutRef.current = setTimeout(() => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                let top = 0;
                let left = 0;

                // Positionnement simple (à améliorer si besoin de calculer la taille du tooltip avant affichage)
                // Note: Pour un positionnement parfait, on devrait utiliser une lib comme floating-ui,
                // mais ici on fait un calcul approximatif simple pour rester léger.

                switch (position) {
                    case 'top':
                        top = rect.top - 10;
                        left = rect.left + rect.width / 2;
                        break;
                    case 'bottom':
                        top = rect.bottom + 10;
                        left = rect.left + rect.width / 2;
                        break;
                    case 'left':
                        top = rect.top + rect.height / 2;
                        left = rect.left - 10;
                        break;
                    case 'right':
                        top = rect.top + rect.height / 2;
                        left = rect.right + 10;
                        break;
                }

                setCoords({ top: top + window.scrollY, left: left + window.scrollX });
                setIsVisible(true);
            }
        }, delay);
    };

    const hide = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    // Cloner l'enfant pour attacher les refs et événements
    const trigger = React.cloneElement(children, {
        // @ts-ignore - ref est valide sur les éléments React
        ref: triggerRef,
        onMouseEnter: show,
        onMouseLeave: hide,
        onFocus: show,
        onBlur: hide,
        ...children.props
    });

    return (
        <>
            {trigger}
            {isVisible && createPortal(
                <div
                    className={`
            fixed z-[9999] px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-sm whitespace-nowrap pointer-events-none
            animate-fade-in
          `}
                    style={{
                        top: coords.top,
                        left: coords.left,
                        transform:
                            position === 'top' ? 'translate(-50%, -100%)' :
                                position === 'bottom' ? 'translate(-50%, 0)' :
                                    position === 'left' ? 'translate(-100%, -50%)' :
                                        'translate(0, -50%)'
                    }}
                    role="tooltip"
                >
                    {content}
                    {/* Flèche */}
                    <div
                        className={`
              absolute w-2 h-2 bg-gray-900 transform rotate-45
              ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
                                position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
                                    position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
                                        'left-[-4px] top-1/2 -translate-y-1/2'
                            }
            `}
                    />
                </div>,
                document.body
            )}
        </>
    );
};

export default Tooltip;
