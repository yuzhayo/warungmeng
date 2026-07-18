import type { Key } from "react";
import { useCallback, useState } from "react";

export interface SingleExpandedRowController<RecordType> {
  readonly expandedRowKeys: readonly Key[];
  readonly isExpanded: (record: RecordType) => boolean;
  readonly onExpand: (expanded: boolean, record: RecordType) => void;
  readonly toggle: (record: RecordType) => void;
}

export function useSingleExpandedRow<RecordType>(
  getRowKey: (record: RecordType) => Key,
): SingleExpandedRowController<RecordType> {
  const [expandedRowKeys, setExpandedRowKeys] = useState<readonly Key[]>([]);

  const isExpanded = useCallback(
    (record: RecordType) => expandedRowKeys.includes(getRowKey(record)),
    [expandedRowKeys, getRowKey],
  );

  const onExpand = useCallback(
    (expanded: boolean, record: RecordType) => {
      setExpandedRowKeys(expanded ? [getRowKey(record)] : []);
    },
    [getRowKey],
  );

  const toggle = useCallback(
    (record: RecordType) => {
      const rowKey = getRowKey(record);
      setExpandedRowKeys((current) => (current.includes(rowKey) ? [] : [rowKey]));
    },
    [getRowKey],
  );

  return {
    expandedRowKeys,
    isExpanded,
    onExpand,
    toggle,
  };
}
