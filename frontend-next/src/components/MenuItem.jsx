'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MenuItem = ({ icon: Icon, label, path, onClick, nested = false, children }) => {
  const pathname = usePathname() || '';
  const active = path ? pathname.startsWith(path) : false;

  const baseClasses = `flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-medium transition-all duration-200 ${
    nested ? 'pl-8 text-slate-700 hover:text-slate-900' : 'text-slate-700 hover:bg-slate-50'
  }`;

  const activeClasses = nested
    ? 'bg-[#2b2b27] text-white font-semibold'
    : 'bg-[#2b2b27] text-white font-semibold';

  return (
    <div>
      {path ? (
        <Link
          href={path}
          className={`${baseClasses} ${active ? activeClasses : 'text-slate-650 hover:bg-slate-50/50'}`}
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
