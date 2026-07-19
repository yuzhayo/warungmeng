import { OutletList } from "../components/OutletList";
import { OutletDetail } from "../components/OutletDetail";
import { useBusinessHours } from "../application/useBusinessHours";

export function BusinessHoursScreen() {
  const bh = useBusinessHours();
  const { outlets, selectedOutletId } = bh.state;

  if (!selectedOutletId) {
    return (
      <OutletList
        outlets={outlets}
        selectedOutletId={selectedOutletId}
        onSelect={bh.selectOutlet}
      />
    );
  }

  return <OutletDetail {...bh} />;
}
