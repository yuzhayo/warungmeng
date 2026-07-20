import { useMemo, useRef, useState } from "react";
import type {
  OutletSchedule,
  SpecialSchedule,
  ValidationError,
  TouchedFields,
} from "./businessHoursModel";
import {
  cloneOutletSchedule,
  outletsEqual,
  validateRegularSchedule,
  validateSpecialSchedule,
  validateAllSpecials,
  addRangeToDay,
  removeRangeFromDay,
  closeDay,
  reopenDay,
  emptyTouched,
  touchRangeField,
  touchDay,
  applySaveSorts,
  BH_DEFAULT_RANGE,
  BH_WEEKDAYS,
} from "./businessHoursModel";
import { INITIAL_OUTLETS } from "./businessHoursFixtures";

export type EditMode = "readonly" | "editing";
export type DirtyIntent = "cancel" | "back" | "tab" | "outlet" | null;

export interface PendingOutletSwitch {
  readonly outletId: string;
}

export interface BusinessHoursState {
  readonly outlets: readonly OutletSchedule[];
  readonly selectedOutletId: string | null;
  readonly editMode: EditMode;
  readonly draft: OutletSchedule | null;
  readonly internalTab: InternalTab;
  readonly dirtyIntent: DirtyIntent;
  readonly confirmOpen: boolean;
  readonly saveAttempted: boolean;
  readonly showSavedFeedback: boolean;
  readonly touched: TouchedFields;
  readonly pendingOutletSwitch: PendingOutletSwitch | null;
}

export type InternalTab = "regular" | "special";

export function useBusinessHours(initialOutlets: readonly OutletSchedule[] = INITIAL_OUTLETS) {
  const [outlets, setOutlets] = useState<OutletSchedule[]>(() =>
    [...initialOutlets].map((o) => cloneOutletSchedule(o)),
  );
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>("readonly");
  const [draft, setDraft] = useState<OutletSchedule | null>(null);
  // ponytail: mirror draft in a ref so save() reads the latest committed draft
  // even when React batches the setDraft update. Replace with a reducer if the
  // number of mutations grows.
  const draftRef = useRef<OutletSchedule | null>(null);
  const syncDraft = (next: OutletSchedule | null) => {
    draftRef.current = next;
    setDraft(next);
  };
  const [internalTab, setInternalTab] = useState<InternalTab>("regular");
  const [dirtyIntent, setDirtyIntent] = useState<DirtyIntent>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [touched, setTouched] = useState<TouchedFields>(emptyTouched());
  const [pendingOutletSwitch, setPendingOutletSwitch] = useState<PendingOutletSwitch | null>(null);

  const idCounter = useRef(0);
  function nextId(): string {
    idCounter.current += 1;
    return `bh-draft-${idCounter.current}`;
  }

  const savedOutlet = useMemo(
    () => outlets.find((o) => o.id === selectedOutletId) ?? null,
    [outlets, selectedOutletId],
  );

  const isDirty = useMemo(
    () => draft !== null && savedOutlet !== null && !outletsEqual(draft, savedOutlet),
    [draft, savedOutlet],
  );

  const regularErrors = useMemo(
    () => (draft ? validateRegularSchedule(draft.regular) : []),
    [draft],
  );
  const specialErrors = useMemo(() => (draft ? validateAllSpecials(draft.specials) : []), [draft]);
  const hasErrors = regularErrors.length > 0 || specialErrors.length > 0;

  function selectOutlet(id: string): void {
    if (editMode === "editing" && isDirty) {
      setDirtyIntent("outlet");
      setPendingOutletSwitch({ outletId: id });
      setConfirmOpen(true);
      return;
    }
    setEditMode("readonly");
    syncDraft(null);
    setSaveAttempted(false);
    setShowSavedFeedback(false);
    setTouched(emptyTouched());
    setSelectedOutletId(id);
    setInternalTab("regular");
  }

  function startEdit(): void {
    const outlet = outlets.find((o) => o.id === selectedOutletId);
    if (!outlet) return;
    syncDraft(cloneOutletSchedule(outlet));
    setEditMode("editing");
    setSaveAttempted(false);
    setShowSavedFeedback(false);
    setTouched(emptyTouched());
  }

  function cancelEdit(): void {
    if (isDirty) {
      setDirtyIntent("cancel");
      setConfirmOpen(true);
      return;
    }
    setEditMode("readonly");
    syncDraft(null);
    setSaveAttempted(false);
    setTouched(emptyTouched());
  }

  function confirmDiscard(): void {
    const intent = dirtyIntent;
    const switchTo = pendingOutletSwitch;
    setEditMode("readonly");
    syncDraft(null);
    setConfirmOpen(false);
    setDirtyIntent(null);
    setPendingOutletSwitch(null);
    setSaveAttempted(false);
    setShowSavedFeedback(false);
    setTouched(emptyTouched());

    if (intent === "back") {
      setSelectedOutletId(null);
      setInternalTab("regular");
    } else if (intent === "tab") {
      setInternalTab(internalTab === "regular" ? "special" : "regular");
    } else if (intent === "outlet" && switchTo) {
      setSelectedOutletId(switchTo.outletId);
      setInternalTab("regular");
    }
  }

  function confirmKeepEditing(): void {
    setConfirmOpen(false);
    setDirtyIntent(null);
    setPendingOutletSwitch(null);
  }

  function goBack(): void {
    if (editMode === "editing" && isDirty) {
      setDirtyIntent("back");
      setConfirmOpen(true);
      return;
    }
    setSelectedOutletId(null);
    setEditMode("readonly");
    syncDraft(null);
    setInternalTab("regular");
    setSaveAttempted(false);
    setTouched(emptyTouched());
  }

  function switchTab(tab: InternalTab): void {
    if (editMode === "editing" && isDirty && tab !== internalTab) {
      setDirtyIntent("tab");
      setConfirmOpen(true);
      return;
    }
    setInternalTab(tab);
  }

  function save(): void {
    const currentDraft = draftRef.current;
    if (!currentDraft) return;
    const currentRegularErrors = validateRegularSchedule(currentDraft.regular);
    const currentSpecialErrors = validateAllSpecials(currentDraft.specials);
    const currentHasErrors = currentRegularErrors.length > 0 || currentSpecialErrors.length > 0;
    if (currentHasErrors) {
      setSaveAttempted(true);
      return;
    }
    const sorted = applySaveSorts(currentDraft);
    setOutlets((prev) => prev.map((o) => (o.id === sorted.id ? cloneOutletSchedule(sorted) : o)));
    setEditMode("readonly");
    syncDraft(null);
    setSaveAttempted(false);
    setShowSavedFeedback(true);
    setTouched(emptyTouched());
  }

  // Draft mutations

  function updateDayOpen(weekday: string, open: boolean): void {
    if (!draft) return;
    setTouched((prev) => touchDay(prev, weekday));
    const nextDays = draft.regular.map((d) => {
      if (d.weekday !== weekday) return d;
      if (open) {
        const fallbackRanges =
          d.ranges.length > 0
            ? d.ranges
            : [{ id: nextId(), start: BH_DEFAULT_RANGE.start, end: BH_DEFAULT_RANGE.end }];
        return reopenDay({ ...d, ranges: d.ranges }, fallbackRanges);
      }
      return closeDay(d);
    });
    syncDraft({ ...draft, regular: nextDays });
  }

  function updateRangeTime(
    weekday: string,
    rangeId: string,
    field: "start" | "end",
    value: string,
  ): void {
    if (!draft) return;
    setTouched((prev) => touchRangeField(touchDay(prev, weekday), rangeId, field));
    const nextDays = draft.regular.map((d) => {
      if (d.weekday !== weekday) return d;
      const ranges = d.ranges.map((r) => (r.id === rangeId ? { ...r, [field]: value } : r));
      return { ...d, ranges };
    });
    syncDraft({ ...draft, regular: nextDays });
  }

  function addRange(weekday: string): void {
    if (!draft) return;
    const day = draft.regular.find((d) => d.weekday === weekday);
    if (!day) return;
    const lastRange = day.ranges.length > 0 ? day.ranges[day.ranges.length - 1] : undefined;
    if (lastRange) {
      const startOk = isValidTime(lastRange.start);
      const endOk = lastRange.end === "24:00" || isValidTime(lastRange.end);
      const orderOk =
        startOk && endOk && timeToMinutes(lastRange.start) < timeToMinutes(lastRange.end);
      if (!startOk || !endOk || !orderOk) {
        // Expose errors on the invalid last range
        setTouched((prev) => touchRangeField(touchDay(prev, weekday), lastRange.id, "start"));
        setTouched((prev) => touchRangeField(prev, lastRange.id, "end"));
        setSaveAttempted(true);
        return;
      }
    }
    const nextDays = draft.regular.map((d) => {
      if (d.weekday !== weekday) return d;
      return addRangeToDay(d, nextId());
    });
    syncDraft({ ...draft, regular: nextDays });
  }

  function removeRange(weekday: string, rangeId: string): void {
    if (!draft) return;
    const nextDays = draft.regular.map((d) => {
      if (d.weekday !== weekday) return d;
      return removeRangeFromDay(d, rangeId);
    });
    syncDraft({ ...draft, regular: nextDays });
  }

  // Special schedule mutations

  function addSpecial(): void {
    if (!draft) return;
    if (draft.specials.length >= 5) return;
    const defaultDays = BH_WEEKDAYS.map((wd) => ({
      weekday: wd,
      open: true,
      ranges: [{ id: nextId(), start: BH_DEFAULT_RANGE.start, end: BH_DEFAULT_RANGE.end }],
    }));
    const newSpecial: SpecialSchedule = {
      id: nextId(),
      name: "",
      enabled: true,
      startDate: "",
      endDate: "",
      days: defaultDays,
    };
    syncDraft({ ...draft, specials: [...draft.specials, newSpecial] });
  }

  function removeSpecial(specialId: string): void {
    if (!draft) return;
    syncDraft({ ...draft, specials: draft.specials.filter((s) => s.id !== specialId) });
  }

  function updateSpecialField(
    specialId: string,
    field: "name" | "startDate" | "endDate" | "enabled",
    value: string | boolean,
  ): void {
    if (!draft) return;
    const specials = draft.specials.map((s) => (s.id === specialId ? { ...s, [field]: value } : s));
    syncDraft({ ...draft, specials });
  }

  function updateSpecialDayOpen(specialId: string, weekday: string, open: boolean): void {
    if (!draft) return;
    const specials = draft.specials.map((s) => {
      if (s.id !== specialId) return s;
      const days = s.days.map((d) => {
        if (d.weekday !== weekday) return d;
        if (open) {
          const fallback =
            d.ranges.length > 0
              ? d.ranges
              : [{ id: nextId(), start: BH_DEFAULT_RANGE.start, end: BH_DEFAULT_RANGE.end }];
          return { ...d, open: true, ranges: fallback };
        }
        return { ...d, open: false };
      });
      return { ...s, days };
    });
    syncDraft({ ...draft, specials });
  }

  function updateSpecialRangeTime(
    specialId: string,
    weekday: string,
    rangeId: string,
    field: "start" | "end",
    value: string,
  ): void {
    if (!draft) return;
    const specials = draft.specials.map((s) => {
      if (s.id !== specialId) return s;
      const days = s.days.map((d) => {
        if (d.weekday !== weekday) return d;
        const ranges = d.ranges.map((r) => (r.id === rangeId ? { ...r, [field]: value } : r));
        return { ...d, ranges };
      });
      return { ...s, days };
    });
    syncDraft({ ...draft, specials });
  }

  function addSpecialRange(specialId: string, weekday: string): void {
    if (!draft) return;
    const specials = draft.specials.map((s) => {
      if (s.id !== specialId) return s;
      const days = s.days.map((d) => {
        if (d.weekday !== weekday) return d;
        return addRangeToDay(d, nextId());
      });
      return { ...s, days };
    });
    syncDraft({ ...draft, specials });
  }

  function removeSpecialRange(specialId: string, weekday: string, rangeId: string): void {
    if (!draft) return;
    const specials = draft.specials.map((s) => {
      if (s.id !== specialId) return s;
      const days = s.days.map((d) => {
        if (d.weekday !== weekday) return d;
        return removeRangeFromDay(d, rangeId);
      });
      return { ...s, days };
    });
    syncDraft({ ...draft, specials });
  }

  function getDayErrors(weekday: string): ValidationError[] {
    if (!draft) return [];
    const day = draft.regular.find((d) => d.weekday === weekday);
    if (!day) return [];
    return validateRegularSchedule([day]);
  }

  function getSpecialErrors(specialId: string): ValidationError[] {
    if (!draft) return [];
    const special = draft.specials.find((s) => s.id === specialId);
    if (!special) return [];
    return validateSpecialSchedule(special, draft.specials);
  }

  // Helpers for the addRange guard
  function isValidTime(v: string): boolean {
    const re = /^\d{2}:\d{2}$/;
    if (!re.test(v)) return false;
    const hh = Number(v.slice(0, 2));
    const mm = Number(v.slice(3, 5));
    return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
  }
  function timeToMinutes(v: string): number {
    if (v === "24:00") return 1440;
    return Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5));
  }

  const state: BusinessHoursState = {
    outlets,
    selectedOutletId,
    editMode,
    draft,
    internalTab,
    dirtyIntent,
    confirmOpen,
    saveAttempted,
    showSavedFeedback,
    touched,
    pendingOutletSwitch,
  };

  return {
    state,
    isDirty,
    hasErrors,
    regularErrors,
    specialErrors,
    savedOutlet,
    selectOutlet,
    startEdit,
    cancelEdit,
    confirmDiscard,
    confirmKeepEditing,
    goBack,
    switchTab,
    save,
    updateDayOpen,
    updateRangeTime,
    addRange,
    removeRange,
    addSpecial,
    removeSpecial,
    updateSpecialField,
    updateSpecialDayOpen,
    updateSpecialRangeTime,
    addSpecialRange,
    removeSpecialRange,
    getDayErrors,
    getSpecialErrors,
  };
}
