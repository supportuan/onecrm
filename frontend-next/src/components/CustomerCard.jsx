'use client';
const CustomerCard = ({ customer }) => {
  return (
    <article className="customer-card">
      <h2>{customer.name}</h2>
      <p>
        <strong>Email:</strong> {customer.email}
      </p>
      <p>
        <strong>Company:</strong> {customer.company}
      </p>
    </article>
  );
};

export default CustomerCard;

