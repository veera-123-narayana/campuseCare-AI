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
