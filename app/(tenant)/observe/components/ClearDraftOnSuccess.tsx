"use client";

import { useEffect } from "react";
import { clearDraft } from "./observationDraft";

export function ClearDraftOnSuccess({ draftKey }: { draftKey: string }) {
  useEffect(() => {
    clearDraft(draftKey);
  }, [draftKey]);

  return null;
}
