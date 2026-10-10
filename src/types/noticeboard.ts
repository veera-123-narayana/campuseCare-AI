export interface NoticeboardEventItem {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  affectedRooms: string[];
  note: string;
  approved: boolean;
}

export function getEventStatus(
  date: string,
  startTime: string,
  endTime: string
): 'Upcoming' | 'In progress' | 'Ended' {
  try {
    const now = new Date();
    const [year, month, day] = (date || '').split('-').map(Number);
    if (!year || !month || !day) return 'Upcoming';

    const [startH, startM] = (startTime || '00:00').split(':').map(Number);
    const [endH, endM] = (endTime || '23:59').split(':').map(Number);

    const startDateTime = new Date(year, month - 1, day, startH || 0, startM || 0, 0);
    const endDateTime = new Date(year, month - 1, day, endH || 0, endM || 0, 0);

    if (now < startDateTime) {
      return 'Upcoming';
    } else if (now >= startDateTime && now <= endDateTime) {
      return 'In progress';
    } else {
      return 'Ended';
    }
  } catch {
    return 'Upcoming';
  }
}
