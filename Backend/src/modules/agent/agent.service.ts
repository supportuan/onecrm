import crypto from 'crypto';

export type ContractTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface AgentProfile {
  id: string;
  agentCode: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
  contractTier: ContractTier;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  permissions: string[];
  createdAt: string;
}

export interface AssociatedStudent {
  id: string;
  studentId: string;
  name: string;
  email: string;
  program: string;
  university: string;
  intake: string;
  status: 'APPLICANT' | 'ENROLLED' | 'ON_HOLD';
}

export interface StudentDocument {
  id: string;
  studentId: string;
  name: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface UniversityPoc {
  id: string;
  university: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface PocContactLog {
  id: string;
  agentId: string;
  pocId: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface TuitionPayment {
  id: string;
  agentId: string;
  studentId: string;
  university: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  reference: string;
  createdAt: string;
}

const CONTRACT_PERMISSIONS: Record<ContractTier, string[]> = {
  BASIC: ['VIEW_PROFILE', 'VIEW_ASSOCIATED_STUDENTS'],
  STANDARD: ['VIEW_PROFILE', 'VIEW_ASSOCIATED_STUDENTS', 'MANAGE_STUDENT_DOCUMENTS', 'CONTACT_UNIVERSITY_POC'],
  PREMIUM: [
    'VIEW_PROFILE',
    'VIEW_ASSOCIATED_STUDENTS',
    'MANAGE_STUDENT_DOCUMENTS',
    'CONTACT_UNIVERSITY_POC',
    'MAKE_TUITION_PAYMENTS',
  ],
};

const agents: AgentProfile[] = [
  {
    id: 'agt_1',
    agentCode: 'AGT-1001',
    name: 'Priya Menon',
    email: 'priya.agent@applyuninow.com',
    password: 'password',
    phone: '+91 98765 11111',
    company: 'Global Edu Partners',
    contractTier: 'STANDARD',
    status: 'ACTIVE',
    permissions: CONTRACT_PERMISSIONS.STANDARD,
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'agt_2',
    agentCode: 'AGT-1002',
    name: 'James Okonkwo',
    email: 'james.agent@applyuninow.com',
    password: 'password',
    phone: '+44 7700 900123',
    company: 'Study Abroad Hub',
    contractTier: 'PREMIUM',
    status: 'ACTIVE',
    permissions: CONTRACT_PERMISSIONS.PREMIUM,
    createdAt: '2026-02-01T00:00:00.000Z',
  },
];

const studentDirectory: AssociatedStudent[] = [
  {
    id: 'stu_1',
    studentId: 'S1001',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@aun.edu',
    program: 'MBA',
    university: 'University of Manchester',
    intake: 'Fall 2026',
    status: 'ENROLLED',
  },
  {
    id: 'stu_2',
    studentId: 'S1002',
    name: 'Meera Nair',
    email: 'meera.nair@aun.edu',
    program: 'Data Science',
    university: 'Arizona State University',
    intake: 'Spring 2027',
    status: 'APPLICANT',
  },
  {
    id: 'stu_3',
    studentId: 'S1003',
    name: 'Liam Chen',
    email: 'liam.chen@aun.edu',
    program: 'Computer Science',
    university: 'University of Toronto',
    intake: 'Fall 2026',
    status: 'APPLICANT',
  },
];

const agentStudentLinks: { agentId: string; studentId: string }[] = [
  { agentId: 'agt_1', studentId: 'stu_1' },
  { agentId: 'agt_1', studentId: 'stu_2' },
  { agentId: 'agt_2', studentId: 'stu_1' },
  { agentId: 'agt_2', studentId: 'stu_3' },
];

let documents: StudentDocument[] = [
  {
    id: 'doc_1',
    studentId: 'stu_1',
    name: 'Passport Copy',
    type: 'Identity',
    uploadedBy: 'agt_1',
    uploadedAt: '2026-04-12T10:00:00.000Z',
  },
];

const universityPocs: UniversityPoc[] = [
  {
    id: 'poc_1',
    university: 'University of Manchester',
    name: 'Dr. Sarah Mitchell',
    role: 'International Admissions Lead',
    email: 's.mitchell@manchester.ac.uk',
    phone: '+44 161 306 0000',
  },
  {
    id: 'poc_2',
    university: 'Arizona State University',
    name: 'Mark Delgado',
    role: 'Enrollment Coordinator',
    email: 'm.delgado@asu.edu',
    phone: '+1 480 965 0000',
  },
  {
    id: 'poc_3',
    university: 'University of Toronto',
    name: 'Elena Vasquez',
    role: 'Graduate Programs POC',
    email: 'e.vasquez@utoronto.ca',
    phone: '+1 416 978 0000',
  },
];

let pocContacts: PocContactLog[] = [];
let payments: TuitionPayment[] = [];

const stripPassword = ({ password, ...agent }: AgentProfile) => agent;

export const findAgentForAuth = async (email: string) =>
  agents.find((a) => a.email.toLowerCase() === email.toLowerCase()) || null;

export const getAgentById = async (agentId: string) => {
  const agent = agents.find((a) => a.id === agentId);
  return agent ? stripPassword(agent) : null;
};

export const getAgentByEmail = async (email: string) => {
  const agent = agents.find((a) => a.email.toLowerCase() === email.toLowerCase());
  return agent ? stripPassword(agent) : null;
};

export const hasPermission = (agent: AgentProfile | null, permission: string) => {
  if (!agent) return false;
  return agent.permissions.includes(permission);
};

export const getAssociatedStudentIds = (agentId: string) =>
  agentStudentLinks.filter((l) => l.agentId === agentId).map((l) => l.studentId);

export const assertStudentAccess = (agentId: string, studentId: string) => {
  const allowed = getAssociatedStudentIds(agentId).includes(studentId);
  if (!allowed) throw new Error('Access denied: student is not associated with this agent');
};

export const getMyStudents = async (agentId: string) => {
  const ids = getAssociatedStudentIds(agentId);
  return studentDirectory.filter((s) => ids.includes(s.id));
};

export const getMyStudentById = async (agentId: string, studentId: string) => {
  assertStudentAccess(agentId, studentId);
  return studentDirectory.find((s) => s.id === studentId) || null;
};

export const getStudentDocuments = async (agentId: string, studentId: string) => {
  assertStudentAccess(agentId, studentId);
  return documents.filter((d) => d.studentId === studentId);
};

export const uploadStudentDocument = async (
  agentId: string,
  studentId: string,
  doc: { name: string; type: string }
) => {
  assertStudentAccess(agentId, studentId);
  if (!doc.name?.trim() || !doc.type?.trim()) throw new Error('Document name and type are required');

  const newDoc: StudentDocument = {
    id: 'doc_' + crypto.randomBytes(4).toString('hex'),
    studentId,
    name: doc.name.trim(),
    type: doc.type.trim(),
    uploadedBy: agentId,
    uploadedAt: new Date().toISOString(),
  };
  documents.push(newDoc);
  return newDoc;
};

export const getUniversityPocsForAgent = async (agentId: string) => {
  const students = await getMyStudents(agentId);
  const universities = new Set(students.map((s) => s.university));
  return universityPocs.filter((p) => universities.has(p.university));
};

export const contactUniversityPoc = async (
  agentId: string,
  pocId: string,
  payload: { subject: string; message: string }
) => {
  const poc = universityPocs.find((p) => p.id === pocId);
  if (!poc) throw new Error('University POC not found');

  const allowedPocs = await getUniversityPocsForAgent(agentId);
  if (!allowedPocs.some((p) => p.id === pocId)) {
    throw new Error('Access denied: POC is not linked to your associated students');
  }

  const log: PocContactLog = {
    id: 'poclog_' + crypto.randomBytes(4).toString('hex'),
    agentId,
    pocId,
    subject: payload.subject?.trim() || 'General inquiry',
    message: payload.message?.trim() || '',
    createdAt: new Date().toISOString(),
  };
  pocContacts.push(log);
  return { log, poc };
};

export const getMyPayments = async (agentId: string) =>
  payments.filter((p) => p.agentId === agentId);

export const createTuitionPayment = async (
  agentId: string,
  payload: { studentId: string; university: string; amount: number; currency?: string }
) => {
  assertStudentAccess(agentId, payload.studentId);
  const student = studentDirectory.find((s) => s.id === payload.studentId);
  if (!student) throw new Error('Student not found');

  const payment: TuitionPayment = {
    id: 'pay_' + crypto.randomBytes(4).toString('hex'),
    agentId,
    studentId: payload.studentId,
    university: payload.university || student.university,
    amount: Number(payload.amount),
    currency: payload.currency || 'USD',
    status: 'PENDING',
    reference: 'TXN-' + Date.now(),
    createdAt: new Date().toISOString(),
  };
  payments.push(payment);
  return payment;
};

export const getAgentDashboard = async (agentId: string) => {
  const agent = await getAgentById(agentId);
  if (!agent) return null;

  const students = await getMyStudents(agentId);
  const myPayments = await getMyPayments(agentId);

  return {
    agent,
    summary: {
      associatedStudents: students.length,
      pendingPayments: myPayments.filter((p) => p.status === 'PENDING').length,
      documentsOnFile: documents.filter((d) =>
        students.some((s) => s.id === d.studentId)
      ).length,
    },
    permissions: agent.permissions,
    contractTier: agent.contractTier,
  };
};

export const listAgents = async () => agents.map(stripPassword);

export const onboardAgent = async (data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  contractTier: ContractTier;
  studentIds?: string[];
}) => {
  if (!data.name?.trim() || !data.email?.trim()) {
    throw new Error('Agent name and email are required');
  }

  const exists = agents.some((a) => a.email.toLowerCase() === data.email.toLowerCase());
  if (exists) throw new Error('An agent with this email already exists');

  const tier = data.contractTier || 'BASIC';
  const agent: AgentProfile = {
    id: 'agt_' + crypto.randomBytes(4).toString('hex'),
    agentCode: 'AGT-' + Math.floor(1000 + Math.random() * 9000),
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    password: 'password',
    phone: data.phone,
    company: data.company,
    contractTier: tier,
    status: 'ACTIVE',
    permissions: CONTRACT_PERMISSIONS[tier],
    createdAt: new Date().toISOString(),
  };
  agents.push(agent);

  for (const studentId of data.studentIds || []) {
    if (studentDirectory.some((s) => s.id === studentId)) {
      agentStudentLinks.push({ agentId: agent.id, studentId });
    }
  }

  return stripPassword(agent);
};

export const updateMyProfile = async (
  agentId: string,
  updates: { phone?: string; company?: string }
) => {
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) throw new Error('Agent not found');
  if (updates.phone !== undefined) agent.phone = updates.phone;
  if (updates.company !== undefined) agent.company = updates.company;
  return stripPassword(agent);
};

export const getContractTiers = () =>
  Object.entries(CONTRACT_PERMISSIONS).map(([tier, permissions]) => ({
    tier,
    permissions,
  }));
