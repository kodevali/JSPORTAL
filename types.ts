
export enum UserRole {
  USER = 'USER',
  MANAGER = 'MANAGER',
  IT = 'IT_ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
  createdBy: string;
  createdAt: string;
  responses: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  isStaff: boolean;
}

export interface DownloadItem {
  id: string;
  name: string;
  category: string;
  size: string;
  minRole: UserRole;
  updatedAt: string;
}

export interface NewsCard {
  title: string;
  summary: string;
  link: string;
  date: string;
  image: string;
}
