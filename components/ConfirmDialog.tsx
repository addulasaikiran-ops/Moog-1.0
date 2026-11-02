"use client";

import { useEffect, useRef } from "react";
import styles from "./ConfirmDialog.module.css";

export default function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", busy = false, onCancel, onConfirm }: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className={styles.dialog} aria-labelledby="moog-dialog-title" aria-describedby="moog-dialog-description" onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }} onClick={event => { if (event.target === ref.current && !busy) onCancel(); }}>
    <div className={styles.mark} aria-hidden="true">!</div>
    <h2 id="moog-dialog-title" className={styles.title}>{title}</h2>
    <p id="moog-dialog-description" className={styles.description}>{description}</p>
    <div className={styles.actions}><button type="button" className={styles.secondary} onClick={onCancel} disabled={busy}>Keep share</button><button type="button" className={styles.danger} onClick={onConfirm} disabled={busy}>{busy ? "Revoking…" : confirmLabel}</button></div>
  </dialog>;
}
