'use client';

import HRPageGuard from '@/components/HRPageGuard';

export default function HrLayout({ children }) {
  return <HRPageGuard>{children}</HRPageGuard>;
}
