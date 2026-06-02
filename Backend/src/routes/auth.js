import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in to get a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Mock authentication - replace with actual DB check in production
  if (username === 'admin' && password === 'password') {
    // Generate token valid for 24 hours
    const token = jwt.sign(
      { id: 1, username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return res.json({ token });
  }

  return res.status(401).json({ error: 'Invalid credentials. Use admin/password' });
});

export default router;
