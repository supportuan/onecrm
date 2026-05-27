'use client';
import Link from 'next/link';


const NotFound = () => (
  <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm text-center">
    <h1 className="text-3xl font-semibold text-slate-900">Page not found</h1>
    <p className="mt-3 text-slate-600">The page you are looking for does not exist.</p>
    <Link href="/dashboard/overview" className="mt-6 inline-flex rounded-3xl bg-slate-900 px-6 py-3 text-white transition hover:bg-slate-700">
      Return to Dashboard
    </Link>
  </section>
);

export default NotFound;

