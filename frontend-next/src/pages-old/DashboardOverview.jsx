'use client';
const DashboardOverview = () => {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Students', value: '12,847', delta: '12.5%' },
          { label: 'Active Applications', value: '2,156', delta: '8.2%' },
          { label: 'Partner Agencies', value: '248', delta: '5.1%' },
          { label: 'Revenue (MTD)', value: '$1.2M', delta: '18.7%' },
        ].map((metric) => (
          <div key={metric.label} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{metric.value}</p>
            <p className="mt-2 text-sm text-emerald-600">{metric.delta} vs last month</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Intake Trends</h2>
              <p className="mt-1 text-sm text-slate-500">Applications and enrollments over time</p>
            </div>
            <div className="flex gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">Applications</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">Enrollments</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">Revenue</span>
            </div>
          </div>
          <div className="mt-8 h-[320px] rounded-[28px] bg-gradient-to-br from-slate-100 to-slate-50 p-6">
            <div className="h-full rounded-[28px] border border-dashed border-slate-300 bg-white" />
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {['Add Student', 'New Application', 'Send Email', 'Schedule Meeting', 'Upload Documents', 'Send SMS'].map((action, idx) => (
              <button
                key={action}
                className={`rounded-3xl py-4 text-sm font-semibold transition ${
                  idx === 0 ? 'bg-slate-900 text-white' : idx === 1 ? 'bg-amber-500 text-slate-950' : idx === 2 ? 'bg-sky-500 text-white' : idx === 3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardOverview;

