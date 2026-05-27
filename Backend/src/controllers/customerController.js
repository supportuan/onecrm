import { query } from "../db/index.js";

export const getCustomers = async (req, res, next) => {
  try {
    const result = await query(
      "SELECT id, name, email, company FROM customers LIMIT 50",
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};
