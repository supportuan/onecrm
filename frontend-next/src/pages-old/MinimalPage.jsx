'use client';
const MinimalPage = ({ title, description }) => (
  <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
    <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
    <p className="mt-3 text-slate-600">{description}</p>
  </section>
);

export default MinimalPage;

