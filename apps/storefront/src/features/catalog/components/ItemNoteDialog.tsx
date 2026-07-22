import { useState } from "react";
import { Button, Input, Modal } from "antd";
import { useTranslation } from "react-i18next";
import styles from "../MenuDetail.module.css";

const NOTE_MAX_LENGTH = 160;

interface ItemNoteDialogProps {
  note: string;
  onNoteChange: (note: string) => void;
}

export function ItemNoteDialog({ note, onNoteChange }: ItemNoteDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const openDialog = () => {
    setDraft(note);
    setOpen(true);
  };

  const confirm = () => {
    onNoteChange(draft.trim());
    setOpen(false);
  };

  const cancel = () => {
    setOpen(false);
  };

  return (
    <div className={styles.noteRow}>
      <Button onClick={openDialog}>
        {note ? t("storefront.detail.note.edit") : t("storefront.detail.note.add")}
      </Button>
      {note ? <p className={styles.notePreview}>{note}</p> : null}
      <Modal
        title={t("storefront.detail.note.title")}
        open={open}
        destroyOnHidden
        onOk={confirm}
        onCancel={cancel}
        okText={t("storefront.detail.note.save")}
        cancelText={t("storefront.detail.note.cancel")}
      >
        <Input.TextArea
          aria-label={t("storefront.detail.note.title")}
          placeholder={t("storefront.detail.note.placeholder")}
          maxLength={NOTE_MAX_LENGTH}
          showCount
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </Modal>
    </div>
  );
}
