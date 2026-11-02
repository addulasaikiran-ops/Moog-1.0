"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function RevealOnceForm({ action }: { action: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [confirm, setConfirm] = useState(false);
  return <>
    <form ref={formRef} action={action} method="post">
      <button className="minimalRevealButton" type="button" onClick={() => setConfirm(true)}>Reveal once <span aria-hidden="true">→</span></button>
    </form>
    <ConfirmDialog open={confirm} title="Reveal this one-time share?" description="After the content is successfully revealed, this share is consumed and cannot be opened again. Continue only when you are ready to read it." confirmLabel="Reveal content" onCancel={() => setConfirm(false)} onConfirm={() => formRef.current?.requestSubmit()} />
  </>;
}
