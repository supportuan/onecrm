'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MenuItem = ({ icon: Icon, label, path, onClick, nested = false, children }) => {
  const pathname = usePathname() || '';
  const active = path ? pathname.startsWith(path) : false;

  const baseClasses = `flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-semibold transition-all duration-200 ${
    nested ? 'pl-8 text-slate-600 hover:text-indigo-650' : 'text-slate-700 hover:bg-slate-50'
  }`;

  const activeClasses = nested
    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 shadow-sm'
    : 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100';

  return (
    <div>
      {path ? (
        <Link
          href={path}
          className={`${baseClasses} ${active ? activeClasses : 'text-slate-500 hover:bg-slate-50/50'}`}
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
