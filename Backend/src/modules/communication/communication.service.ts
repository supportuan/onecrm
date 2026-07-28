import { prisma } from '../../prisma.js';
import { resolveStudentScopeWhere, studentSelfWhere } from '../student-crm/scoping.js';

type Actor = { id: number; role?: string; email?: string | null };

const authorLabel = async (authorId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: authorId },
    select: { fullName: true, role: true },
  });
  if (!user) return 'User';
  if (user.role === 'STUDENT') return user.fullName || 'Student';
  return user.fullName || 'Counsellor';
};

export const assertStudentAccess = async (studentId: number, actor: Actor) => {
  const where = await resolveStudentScopeWhere(actor);
  const student = await prisma.student.findFirst({
    where: { id: studentId, ...where },
    include: {
      contact: { select: { id: true, fullName: true, email: true } },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          counsellorId: true,
          counsellor: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });
  if (!student) throw new Error('Student not found or access denied');
  return student;
};

export const resolveStudentForActor = async (actor: Actor) => {
  const student = await prisma.student.findFirst({
    where: studentSelfWhere(actor),
    include: {
      contact: { select: { id: true, fullName: true, email: true } },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          counsellorId: true,
          counsellor: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });
  if (!student) throw new Error('Student profile not found');
  return student;
};

const mapMessage = async (row: {
  id: number;
  studentId: number;
  authorId: number;
  message: string;
  read: boolean;
  createdAt: Date;
}) => ({
  id: row.id,
  studentId: row.studentId,
  authorId: row.authorId,
  authorName: await authorLabel(row.authorId),
  message: row.message,
  read: row.read,
  createdAt: row.createdAt,
  isMine: false as boolean,
});

export const listConversations = async (actor: Actor) => {
  const scope = await resolveStudentScopeWhere(actor);
  const students = await prisma.student.findMany({
    where: scope,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      contactId: true,
      contact: { select: { id: true, fullName: true } },
    },
    orderBy: { fullName: 'asc' },
    take: 200,
  });

  const studentIds = students.map((s) => s.id);
  if (!studentIds.length) return [];

  const messages = await prisma.chat.findMany({
    where: { studentId: { in: studentIds } },
    orderBy: { createdAt: 'desc' },
  });

  const latestByStudent = new Map<number, (typeof messages)[0]>();
  const unreadByStudent = new Map<number, number>();

  for (const msg of messages) {
    if (!latestByStudent.has(msg.studentId)) latestByStudent.set(msg.studentId, msg);
    if (!msg.read && msg.authorId !== actor.id) {
      unreadByStudent.set(msg.studentId, (unreadByStudent.get(msg.studentId) || 0) + 1);
    }
  }

  return students
    .map((student) => {
      const latest = latestByStudent.get(student.id);
      return {
        studentId: student.id,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        counsellorName: student.contact?.fullName || null,
        lastMessage: latest?.message || null,
        lastMessageAt: latest?.createdAt || null,
        unreadCount: unreadByStudent.get(student.id) || 0,
      };
    })
    .sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      if (bTime !== aTime) return bTime - aTime;
      return a.fullName.localeCompare(b.fullName);
    });
};

export const getThread = async (studentId: number, actor: Actor) => {
  const student = await assertStudentAccess(studentId, actor);
  const rows = await prisma.chat.findMany({
    where: { studentId },
    orderBy: { createdAt: 'asc' },
  });

  const messages = await Promise.all(
    rows.map(async (row) => ({
      ...(await mapMessage(row)),
      isMine: row.authorId === actor.id,
    }))
  );

  return {
    student: {
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      counsellor: student.contact || student.user?.counsellor || null,
    },
    messages,
  };
};

export const getMyThread = async (actor: Actor) => {
  const student = await resolveStudentForActor(actor);
  return getThread(student.id, actor);
};

export const sendMessage = async (studentId: number, message: string, actor: Actor) => {
  const trimmed = message.trim();
  if (!trimmed) throw new Error('Message is required');

  await assertStudentAccess(studentId, actor);

  const row = await prisma.chat.create({
    data: {
      studentId,
      authorId: actor.id,
      message: trimmed,
      read: false,
    },
  });

  return {
    ...(await mapMessage(row)),
    isMine: true,
  };
};

export const sendMyMessage = async (message: string, actor: Actor) => {
  const student = await resolveStudentForActor(actor);
  return sendMessage(student.id, message, actor);
};

export const markThreadRead = async (studentId: number, actor: Actor) => {
  await assertStudentAccess(studentId, actor);
  await prisma.chat.updateMany({
    where: {
      studentId,
      authorId: { not: actor.id },
      read: false,
    },
    data: { read: true },
  });
  return { success: true };
};

export const markMyThreadRead = async (actor: Actor) => {
  const student = await resolveStudentForActor(actor);
  return markThreadRead(student.id, actor);
};
