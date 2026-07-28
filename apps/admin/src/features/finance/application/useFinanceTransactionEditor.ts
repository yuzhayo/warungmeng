import type {
  FinanceDirection,
  FinanceTransaction,
  ManualFinanceTransactionInput,
} from "@warungmeng/domain";
import { useCallback, useState } from "react";
import type { FinanceRecordCapability } from "./financeCapabilities";

export type FinanceEditorMode = "create" | "edit";

export interface FinanceEditorState {
  readonly open: boolean;
  readonly mode: FinanceEditorMode;
  readonly defaultDirection: FinanceDirection;
  readonly transaction: FinanceTransaction | null;
}

const CLOSED_EDITOR: FinanceEditorState = {
  open: false,
  mode: "create",
  defaultDirection: "outflow",
  transaction: null,
};

export function useFinanceTransactionEditor(record: FinanceRecordCapability) {
  const [editor, setEditor] = useState<FinanceEditorState>(CLOSED_EDITOR);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = useCallback((direction: FinanceDirection = "outflow") => {
    setEditor({ open: true, mode: "create", defaultDirection: direction, transaction: null });
  }, []);

  const openEdit = useCallback((transaction: FinanceTransaction) => {
    if (transaction.source !== "manual" || transaction.status === "voided") return;
    setEditor({
      open: true,
      mode: "edit",
      defaultDirection: transaction.direction,
      transaction,
    });
  }, []);

  const close = useCallback(() => {
    if (!submitting) setEditor(CLOSED_EDITOR);
  }, [submitting]);

  const save = useCallback(
    async (input: ManualFinanceTransactionInput): Promise<boolean> => {
      if (submitting) return false;
      setSubmitting(true);
      try {
        const result = editor.transaction
          ? await record.updateManualTransaction(editor.transaction.id, input)
          : await record.createManualTransaction(input);
        if (!result) return false;
        setEditor(CLOSED_EDITOR);
        return true;
      } finally {
        setSubmitting(false);
      }
    },
    [editor.transaction, record, submitting],
  );

  const voidTransaction = useCallback(
    async (transaction: FinanceTransaction): Promise<boolean> => {
      if (submitting || transaction.source !== "manual" || transaction.status === "voided") {
        return false;
      }
      setSubmitting(true);
      try {
        return Boolean(
          await record.voidManualTransaction(transaction.id, new Date().toISOString()),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [record, submitting],
  );

  return {
    editor,
    submitting,
    openCreate,
    openEdit,
    close,
    save,
    voidTransaction,
  } as const;
}
