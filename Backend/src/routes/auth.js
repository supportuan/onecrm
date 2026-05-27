import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, customPermissionsStore } from '../middleware/auth.js';
import * as hrService from '../modules/hr/hr.service.js';
import * as studentService from '../modules/student/student.service.js';
import * as agentService from '../modules/agent/agent.service.js';

const router = express.Router();

// 1. GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  return res.json({ success: true, user: req.user });
});

// 2. POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Let's support both mock login and dynamic email login
  if (username === 'admin' && password === 'password') {
    const token = jwt.sign(
      { id: 'usr_mock_123', email: 'jane.admin@onecrm.com', name: 'Jane Admin', role: 'SUPER_ADMIN', tenantId: 'default-tenant' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    
    // Set httpOnly cookie
    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

      return res.json({ token, success: true, user: { name: 'Jane Admin', email: 'jane.admin@onecrm.com', role: 'SUPER_ADMIN', tenantId: 'default-tenant', workspace: 'hr' } });
  }

  // If user provided a password and it looks like an email/username for simulation:
  try {
    const employeesList = await hrService.getEmployees();
    console.log("[Auth Login Debug] Request payload:", { username, password });
    console.log("[Auth Login Debug] Directory emails:", employeesList.map(e => e.email));
    
    const found = employeesList.find(emp => emp.email.toLowerCase() === username.toLowerCase());
    console.log("[Auth Login Debug] Found employee:", found ? { id: found.id, name: found.name, email: found.email, access_role: found.access_role } : null);

    if (found && password === 'password') {
      const userRole = found.role || found.access_role || 'EMPLOYEE';
      const token = jwt.sign(
        { id: found.id, email: found.email, name: found.name, role: userRole, tenantId: 'default-tenant' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      res.cookie('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });

      const workspace = userRole?.toUpperCase()?.includes('MARKETING') ? 'marketing' : 'hr';
      return res.json({ token, success: true, user: { name: found.name, email: found.email, role: userRole, tenantId: 'default-tenant', workspace } });
    }
  } catch (err) {
    console.error("[Auth Login Debug] Employee verification failed:", err);
  }

  try {
    const agent = await agentService.findAgentForAuth(username);
    if (agent && password === agent.password) {
      const token = jwt.sign(
        { id: agent.id, email: agent.email, name: agent.name, role: 'AGENT', tenantId: 'default-tenant' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      res.cookie('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.json({
        token,
        success: true,
        user: { name: agent.name, email: agent.email, role: 'AGENT', tenantId: 'default-tenant', workspace: 'agent' }
      });
    }
  } catch (err) {
    console.error("[Auth Login Debug] Agent verification failed:", err);
  }

  try {
    const student = await studentService.findStudentForAuth(username);
    if (student && password === student.password) {
      const token = jwt.sign(
        { id: student.id, email: student.email, name: student.name, role: 'STUDENT', tenantId: 'default-tenant' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      res.cookie('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.json({
        token,
        success: true,
        user: { name: student.name, email: student.email, role: 'STUDENT', tenantId: 'default-tenant', workspace: 'student' }
      });
    }
  } catch (err) {
    console.error("[Auth Login Debug] Student verification failed:", err);
  }

  return res.status(401).json({ error: 'Invalid credentials. Use admin/password, employee/student/agent email with password' });
});

// 3. POST /api/auth/callback (SSO Simulator)
router.post('/callback', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required for SSO validation' });
  }

  try {
    const employeesList = await hrService.getEmployees();
    const found = employeesList.find(emp => emp.email.toLowerCase() === email.toLowerCase());
    const student = !found ? await studentService.findStudentForAuth(email) : null;
    const agent = !found && !student ? await agentService.findAgentForAuth(email) : null;
    const userRole = agent ? 'AGENT' : (student ? 'STUDENT' : (found ? (found.role || found.access_role || 'EMPLOYEE') : (email.includes('admin') ? 'SUPER_ADMIN' : 'EMPLOYEE')));
    const workspace = userRole === 'AGENT' ? 'agent' : (userRole === 'STUDENT' ? 'student' : (userRole?.toUpperCase()?.includes('MARKETING') ? 'marketing' : 'hr'));

    const userPayload = {
      id: agent ? agent.id : (student ? student.id : (found ? found.id : 'usr_sso_mock')),
      email,
      name: agent ? agent.name : (student ? student.name : (found ? found.name : email.split('@')[0])),
      role: userRole,
      tenantId: 'default-tenant'
    };

    const token = jwt.sign(
      userPayload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({ token, success: true, user: { ...userPayload, workspace } });
  } catch (err) {
    console.error("SSO callback simulation error:", err);
    return res.status(500).json({ error: 'Internal SSO execution failure' });
  }
});

// 4. POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth-token');
  return res.json({ success: true, message: 'Logged out successfully' });
});

// 5. GET /api/auth/custom-permissions
router.get('/custom-permissions', authenticateToken, (req, res) => {
  const tenantId = req.user.tenantId || 'default-tenant';
  const custom = customPermissionsStore[tenantId] || {};
  return res.json({ success: true, customPermissions: custom });
});

// 6. POST /api/auth/custom-permissions
router.post('/custom-permissions', authenticateToken, (req, res) => {
  const tenantId = req.user.tenantId || 'default-tenant';
  const { customPermissions } = req.body;
  
  if (!customPermissions) {
    return res.status(400).json({ error: 'customPermissions map is required' });
  }

  customPermissionsStore[tenantId] = customPermissions;
  return res.json({ success: true, message: 'Custom permissions stored successfully' });
});

export default router;
