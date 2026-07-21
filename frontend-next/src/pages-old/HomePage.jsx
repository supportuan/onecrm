'use client';
import CustomerCard from '../components/CustomerCard';

const HomePage = ({ customers, loading, error }) => {
  return (
    <main className="page-root">
      <section className="page-header">
        <h1>OneCRM</h1>
        <p>Customer list managed by React and Node.js with PostgreSQL.</p>
      </section>

      {loading && <p>Loading customers...</p>}
      {error && <p className="error-message">{error}</p>}

      <section className="customer-grid">
        {customers.length > 0 ? (
          customers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))
        ) : (
          !loading && <p>No customers found yet.</p>
        )}
      </section>
    </main>
  );
};

export default HomePage;

