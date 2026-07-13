'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MenuItem = ({ icon: Icon, label, path, onClick, nested = false, children }) => {
  const pathname = usePathname() || '';
  const active = path ? pathname.startsWith(path) : false;

  const baseClasses = `flex items-center gap-2.5 rounded-[var(--ui-radius)] py-1.5 text-[13px] transition ${
    nested ? 'pl-8 pr-3' : 'px-3'
  } ${
    active
      ? 'font-medium text-brand bg-brand-soft'
      : 'text-[var(--ui-text-muted)] hover:text-brand hover:bg-brand-soft/60'
  }`;

  const content = (
    <>
      {Icon && <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.5} />}
      <span className="truncate">{label}</span>
      {children && <span className="ml-auto">{children}</span>}
    </>
  );

  return (
    <div>
      {path ? (
        <Link href={path} className={baseClasses} onClick={onClick}>
          {content}
        </Link>
      ) : (
        <button type="button" className={`${baseClasses} w-full text-left`} onClick={onClick}>
          {content}
        </button>
      )}
    </div>
  );
};

export default MenuItem;
