import React, { useEffect } from "react";

export default function Modal({
  open = false,
  title = "",
  titleId = "lrp-modal-title",
  icon = null,                
  children,                   
  primaryText = "OK",
  onClose,
  onPrimary,                  
  centerActions = true,       
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.body.style.overflow = "hidden";   
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="lrp-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      onClick={onClose}
    >
      <div
        className="lrp-modal lrp-modal--compact"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="lrp-modal-close"
          aria-label="Close"
          onClick={onClose}
        >
          ✕
        </button>

        {(title || icon) && (
          <div className="lrp-modal-header">
            {icon && <div className="lrp-modal-icon">{icon}</div>}
            {title && (
              <h2 id={titleId} className="lrp-modal-title">
                {title}
              </h2>
            )}
          </div>
        )}

        {/* Body */}
        <div className="lrp-modal-body">
          {typeof children === "string" ? <p>{children}</p> : children}
        </div>

        {/* Actions */}
        <div
          className={
            "lrp-modal-actions" + (centerActions ? " lrp-modal-actions--center" : "")
          }
        >
          <button
            className="lrp-btn lrp-btn-primary lrp-btn-lg"
            onClick={onPrimary || onClose}
          >
            {primaryText}
          </button>
        </div>
      </div>
    </div>
  );
}
