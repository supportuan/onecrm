const students = [
    {
        id: 'stu_1',
        studentId: 'S1001',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@aun.edu',
        password: 'password',
        program: 'MBA',
        intake: 'Fall 2026',
        status: 'ENROLLED',
        assignedCounsellorEmail: 'raju.kalla@onecrm.com',
    },
    {
        id: 'stu_2',
        studentId: 'S1002',
        name: 'Meera Nair',
        email: 'meera.nair@aun.edu',
        password: 'password',
        program: 'Data Science',
        intake: 'Spring 2027',
        status: 'APPLICANT',
        assignedCounsellorEmail: 'alice.smith@onecrm.com',
    },
];
export const listStudents = async () => students.map(({ password, ...rest }) => rest);
export const findStudentForAuth = async (email) => students.find((student) => student.email.toLowerCase() === email.toLowerCase()) || null;
export const getStudentByEmail = async (email) => {
    const student = students.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (!student)
        return null;
    const { password, ...safeStudent } = student;
    return safeStudent;
};
export const getStudentDashboard = async (email) => {
    const student = await getStudentByEmail(email);
    if (!student)
        return null;
    return {
        profile: student,
        summary: {
            pendingTasks: student.status === 'APPLICANT' ? 3 : 1,
            documentsSubmitted: student.status === 'APPLICANT' ? 5 : 8,
            feesStatus: student.status === 'ENROLLED' ? 'PAID' : 'PENDING',
        },
        modules: ['student', 'hr', 'marketing'],
    };
};
