import { UploadOutlined } from "@ant-design/icons";
import {
  getFinanceCategories,
  MAX_FINANCE_ATTACHMENT_BYTES,
  type FinanceDirection,
  type FinancePaymentMethod,
  type FinanceTransaction,
  type ManualFinanceStatus,
  type ManualFinanceTransactionInput,
} from "@warungmeng/domain";
import type { TranslationKey } from "@warungmeng/i18n";
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Upload,
  type UploadFile,
  type UploadProps,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { FinanceEditorMode } from "../application/useFinanceTransactionEditor";

const CUSTOM_CATEGORY = "custom";

interface FinanceEditorValues {
  readonly direction: FinanceDirection;
  readonly categoryId: string;
  readonly customCategoryLabel?: string;
  readonly amount: number;
  readonly occurredAt: Dayjs;
  readonly paymentMethod: FinancePaymentMethod;
  readonly status: ManualFinanceStatus;
  readonly description: string;
  readonly referenceNumber?: string;
  readonly attachment?: UploadFile[];
}

interface FinanceTransactionEditorDialogProps {
  readonly defaultDirection: FinanceDirection;
  readonly mode: FinanceEditorMode;
  readonly open: boolean;
  readonly submitting: boolean;
  readonly transaction: FinanceTransaction | null;
  readonly onCancel: () => void;
  readonly onSubmit: (input: ManualFinanceTransactionInput) => Promise<boolean>;
}

function fileListFromTransaction(transaction: FinanceTransaction | null): UploadFile[] {
  if (!transaction?.attachment) return [];
  return [
    {
      uid: transaction.attachment.id,
      name: transaction.attachment.name,
      type: transaction.attachment.mimeType,
      size: transaction.attachment.size,
      status: "done",
    },
  ];
}

function initialValues(
  transaction: FinanceTransaction | null,
  direction: FinanceDirection,
): FinanceEditorValues {
  if (transaction) {
    const isCustom = transaction.categoryId.startsWith("custom:");
    return {
      direction: transaction.direction,
      categoryId: isCustom ? CUSTOM_CATEGORY : transaction.categoryId,
      customCategoryLabel: isCustom ? transaction.categoryLabel : undefined,
      amount: transaction.amount.amount,
      occurredAt: dayjs(transaction.occurredAt),
      paymentMethod: transaction.paymentMethod,
      status: transaction.status === "pending" ? "pending" : "posted",
      description: transaction.description,
      referenceNumber: transaction.referenceNumber,
      attachment: fileListFromTransaction(transaction),
    };
  }
  return {
    direction,
    categoryId: "",
    amount: 0,
    occurredAt: dayjs(),
    paymentMethod: "cash",
    status: "posted",
    description: "",
    referenceNumber: "",
    attachment: [],
  };
}

function customCategoryId(label: string): string {
  const slug = label
    .trim()
    .toLocaleLowerCase("id-ID")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `custom:${slug || "other"}`;
}

function isEditorValid(values: Partial<FinanceEditorValues> | undefined): boolean {
  if (!values) return false;
  const file = values.attachment?.[0];
  const attachmentValid =
    !file ||
    ((file.type?.startsWith("image/") || file.type === "application/pdf") &&
      (file.size ?? 0) <= MAX_FINANCE_ATTACHMENT_BYTES);
  return Boolean(
    values.direction &&
    values.categoryId &&
    (values.categoryId !== CUSTOM_CATEGORY || values.customCategoryLabel?.trim()) &&
    Number.isSafeInteger(values.amount) &&
    (values.amount ?? -1) >= 0 &&
    values.occurredAt?.isValid() &&
    values.paymentMethod &&
    values.status &&
    values.description?.trim() &&
    attachmentValid,
  );
}

export function FinanceTransactionEditorDialog({
  defaultDirection,
  mode,
  open,
  submitting,
  transaction,
  onCancel,
  onSubmit,
}: FinanceTransactionEditorDialogProps) {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FinanceEditorValues>();
  const values = Form.useWatch([], form);
  const direction = Form.useWatch("direction", form) ?? defaultDirection;
  const categoryId = Form.useWatch("categoryId", form);
  const categoryOptions = getFinanceCategories(direction).map((category) => ({
    value: category.id,
    label: t(`finance.category.${category.id}` as TranslationKey),
  }));
  categoryOptions.push({ value: CUSTOM_CATEGORY, label: t("finance.category.custom") });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(initialValues(transaction, defaultDirection));
  }, [defaultDirection, form, open, transaction]);

  function requestCancel(): void {
    if (!form.isFieldsTouched()) {
      onCancel();
      return;
    }
    modal.confirm({
      title: t("finance.editor.discardTitle"),
      content: t("finance.editor.discardDescription"),
      okText: t("finance.editor.discard"),
      cancelText: t("finance.editor.keepEditing"),
      okButtonProps: { danger: true },
      onOk: onCancel,
    });
  }

  async function submit(values: FinanceEditorValues): Promise<void> {
    const selectedCategory = getFinanceCategories(values.direction).find(
      (category) => category.id === values.categoryId,
    );
    const customLabel = values.customCategoryLabel?.trim() ?? "";
    const file = values.attachment?.[0];
    await onSubmit({
      occurredAt: values.occurredAt.toISOString(),
      direction: values.direction,
      type: values.direction === "inflow" ? "manual-income" : "expense",
      status: values.status,
      categoryId:
        values.categoryId === CUSTOM_CATEGORY ? customCategoryId(customLabel) : values.categoryId,
      categoryLabel: selectedCategory?.label ?? customLabel,
      amount: { amount: values.amount, currency: "IDR" },
      paymentMethod: values.paymentMethod,
      description: values.description.trim(),
      referenceNumber: values.referenceNumber?.trim() ?? "",
      attachment: file
        ? {
            id: file.uid,
            name: file.name,
            mimeType: file.type ?? "application/octet-stream",
            size: file.size ?? 0,
          }
        : null,
    });
  }

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const accepted = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!accepted || file.size > MAX_FINANCE_ATTACHMENT_BYTES) {
      void message.error(t("finance.validation.attachment"));
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  function previewAttachment(file: UploadFile): void {
    if (!file.originFileObj) {
      void message.info(t("finance.attachment.metadataOnly"));
      return;
    }
    const url = URL.createObjectURL(file.originFileObj);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <Modal
      cancelText={t("finance.actions.cancel")}
      confirmLoading={submitting}
      destroyOnHidden
      mask={{ closable: false }}
      okButtonProps={{ disabled: submitting || !isEditorValid(values) }}
      okText={t("finance.actions.save")}
      onCancel={requestCancel}
      onOk={() => form.submit()}
      open={open}
      title={t(mode === "edit" ? "finance.editor.editTitle" : "finance.editor.createTitle")}
      width="min(46rem, calc(100vw - 2rem))"
    >
      <Form
        className="finance-editor-form"
        form={form}
        layout="vertical"
        onFinish={submit}
        onValuesChange={(changed) => {
          if ("direction" in changed) {
            form.setFieldsValue({ categoryId: "", customCategoryLabel: "" });
          }
        }}
      >
        <Form.Item label={t("finance.editor.direction")} name="direction">
          <Segmented
            block
            options={(["inflow", "outflow"] as const).map((value) => ({
              value,
              label: t(`finance.direction.${value}` as TranslationKey),
            }))}
          />
        </Form.Item>
        <div className="finance-editor-form__row">
          <Form.Item
            label={t("finance.editor.category")}
            name="categoryId"
            rules={[{ required: true, message: t("finance.validation.required") }]}
          >
            <Select
              options={categoryOptions}
              placeholder={t("finance.editor.categoryPlaceholder")}
              showSearch={{ optionFilterProp: "label" }}
            />
          </Form.Item>
          <Form.Item
            label={t("finance.editor.amount")}
            name="amount"
            rules={[
              { required: true, message: t("finance.validation.required") },
              {
                type: "number",
                min: 0,
                message: t("finance.validation.amount"),
              },
              {
                validator: (_, value: number) =>
                  Number.isSafeInteger(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error(t("finance.validation.amount"))),
              },
            ]}
          >
            <InputNumber min={0} precision={0} prefix="Rp" style={{ width: "100%" }} />
          </Form.Item>
        </div>
        {categoryId === CUSTOM_CATEGORY ? (
          <Form.Item
            label={t("finance.editor.customCategory")}
            name="customCategoryLabel"
            rules={[
              { required: true, whitespace: true, message: t("finance.validation.required") },
            ]}
          >
            <Input maxLength={80} />
          </Form.Item>
        ) : null}
        <div className="finance-editor-form__row">
          <Form.Item
            label={t("finance.editor.occurredAt")}
            name="occurredAt"
            rules={[{ required: true, message: t("finance.validation.required") }]}
          >
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label={t("finance.editor.paymentMethod")}
            name="paymentMethod"
            rules={[{ required: true, message: t("finance.validation.required") }]}
          >
            <Select
              options={(["cash", "qris", "card", "bank-transfer", "other"] as const).map(
                (method) => ({
                  value: method,
                  label: t(`finance.payment.${method}` as TranslationKey),
                }),
              )}
            />
          </Form.Item>
        </div>
        <Form.Item
          label={t("finance.editor.status")}
          name="status"
          rules={[{ required: true, message: t("finance.validation.required") }]}
        >
          <Select
            options={(["posted", "pending"] as const).map((status) => ({
              value: status,
              label: t(`finance.status.${status}` as TranslationKey),
            }))}
          />
        </Form.Item>
        <Form.Item
          label={t("finance.editor.description")}
          name="description"
          rules={[{ required: true, whitespace: true, message: t("finance.validation.required") }]}
        >
          <Input.TextArea maxLength={300} rows={3} showCount />
        </Form.Item>
        <Form.Item label={t("finance.editor.referenceNumber")} name="referenceNumber">
          <Input maxLength={80} />
        </Form.Item>
        <Form.Item
          getValueFromEvent={(event: { fileList: UploadFile[] }) => event.fileList}
          label={t("finance.editor.attachment")}
          name="attachment"
          valuePropName="fileList"
        >
          <Upload
            accept="image/*,application/pdf"
            beforeUpload={beforeUpload}
            listType="picture"
            maxCount={1}
            onPreview={previewAttachment}
          >
            <Button icon={<UploadOutlined />}>{t("finance.actions.chooseFile")}</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
