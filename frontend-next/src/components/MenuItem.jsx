'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MenuItem = ({ icon: Icon, label, path, onClick, nested = false, children }) => {
  const pathname = usePathname() || '';
  const active = path ? pathname.startsWith(path) : false;

  const baseClasses = `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
    nested ? 'pl-9 text-neutral-600 hover:text-neutral-900' : 'text-neutral-700 hover:bg-neutral-50'
  }`;

  const activeClasses = nested
    ? 'bg-neutral-100 text-neutral-900 border-l-2 border-neutral-900'
    : 'bg-neutral-100 text-neutral-900';

  return (
    <div>
      {path ? (
        <Link
          href={path}
          className={`${baseClasses} ${active ? activeClasses : 'text-neutral-500 hover:bg-neutral-50'}`}
          onClick={onClick}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
          <span className="ml-auto">{children}</span>
        </Link>
      ) : (
        <button type="button" className={`${baseClasses} w-full text-left`} onClick={onClick}>
          <Icon className="h-4 w-4" />
          <span>{label}</span>
          <span className="ml-auto">{children}</span>
        </button>
      )}
    </div>
  );
};

export default MenuItem;
