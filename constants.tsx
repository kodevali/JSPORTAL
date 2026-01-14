import React from 'react';

export const COLORS = {
  primary: '#044A8D',    // Official JS Bank Blue
  secondary: '#EF7A25',  // JS Orange
  accent: '#FAB51D',     // JS Yellow
  bg: '#f8fafc',
  white: '#ffffff',
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    400: '#94a3b8',
    500: '#64748b',
    800: '#1e293b',
    900: '#0f172a'
  }
};

export const MOCK_NEWS: any[] = [
  {
    title: "JS Bank Reports Strong Growth in Q3",
    summary: "JS Bank continues its upward trajectory with significant increases in digital banking adoption.",
    link: "https://jsbl.com/news/q3-growth",
    date: "Oct 24, 2023",
    image: "https://picsum.photos/seed/bank1/600/400"
  },
  {
    title: "New Sustainable Finance Initiative",
    summary: "Leading the way in green banking, JS Bank launches a new portfolio of sustainable loan products.",
    link: "https://jsbl.com/news/sustainable",
    date: "Oct 22, 2023",
    image: "https://picsum.photos/seed/bank2/600/400"
  },
  {
    title: "Security Update: Multi-Factor Authentication",
    summary: "Ensuring your data stays safe. All internal systems will now require mandatory MFA by year-end.",
    link: "https://jsbl.com/news/security",
    date: "Oct 20, 2023",
    image: "https://picsum.photos/seed/bank3/600/400"
  }
];

export const DOWNLOAD_ITEMS: any[] = [
  { id: '1', name: 'Employee Handbook 2024', category: 'HR', size: '2.4 MB', minRole: 'USER', updatedAt: '2023-12-01' },
  { id: '2', name: 'Annual Performance Review Template', category: 'HR', size: '0.5 MB', minRole: 'USER', updatedAt: '2023-11-15' },
  { id: '3', name: 'Quarterly Strategic Audit Q3', category: 'Finance', size: '15.8 MB', minRole: 'MANAGER', updatedAt: '2023-10-30' },
  { id: '4', name: 'Risk Assessment Framework v2', category: 'Compliance', size: '4.2 MB', minRole: 'MANAGER', updatedAt: '2023-10-10' },
  { id: '5', name: 'Network Architecture Schema', category: 'IT', size: '8.1 MB', minRole: 'IT_ADMIN', updatedAt: '2023-09-25' },
  { id: '6', name: 'Database Recovery Protocols', category: 'IT', size: '1.2 MB', minRole: 'IT_ADMIN', updatedAt: '2023-09-20' },
];