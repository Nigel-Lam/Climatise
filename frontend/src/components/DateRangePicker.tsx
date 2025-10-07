import Calendar, {type CalendarProps } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useStationStore } from '../store.ts';

export function DateRangePicker() {
  const { setEarliest, setLatest } = useStationStore();

  const handleDateRangeChange: CalendarProps['onChange'] = (value) => {
    if (Array.isArray(value) && value.length === 2 && value[0] && value[1]) {
      setEarliest(value[0]);
      setLatest(value[1]);
    }
  };

  return (
    <Calendar selectRange={true} onChange={handleDateRangeChange} />
  );
}
