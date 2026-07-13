'use client';
import Link from 'next/link';


const NotFound = () => (
  <section className="rounded-[28px] border border-neutral-200 bg-white p-8 shadow-sm text-center">
    <h1 className="text-3xl font-semibold text-brand">Page not found</h1>
    <p className="mt-3 text-neutral-600">The page you are looking for does not exist.</p>
    <Link href="/marketing" className="mt-6 inline-flex rounded-lg bg-brand px-6 py-3 text-white transition hover:bg-brand-hover">
      Return to Dashboard
    </Link>
  </section>
);

export default NotFound;

