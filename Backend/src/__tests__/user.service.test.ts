import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockPrisma = {
    user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    lead: {
        create: jest.fn(),
        updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
};

jest.unstable_mockModule("../prisma.js", () => ({
    prisma: mockPrisma,
}));

jest.unstable_mockModule("../utils/password.js", () => ({
    hashPassword: jest.fn(async () => "hashed-password"),
}));

jest.unstable_mockModule("../modules/marketing/services/email.service.js", () => ({
    sendCampaignEmail: jest.fn(() => Promise.resolve()),
}));

jest.unstable_mockModule("../modules/notifications/recipients.js", () => ({
    safeNotify: jest.fn(() => Promise.resolve()),
}));

const userService = await import("../modules/users/user.service.js");
const { hashPassword } = await import("../utils/password.js");
const { sendCampaignEmail } = await import("../modules/marketing/services/email.service.js");
const { safeNotify } = await import("../modules/notifications/recipients.js");

beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
    });
});

describe("user.service - getDefaultModuleAccessByRole", () => {
    it("should return HR module access for HR role", () => {
        const access = userService.getDefaultModuleAccessByRole("HR");

        expect(access.HR).toBeDefined();
        expect(access.HR["Employee Directory"]).toEqual(["VIEW", "EDIT"]);
    });

    it("should return Marketing and Student CRM VIEW access for COUNSELLOR", () => {
        const access = userService.getDefaultModuleAccessByRole("COUNSELLOR");

        expect(access.Marketing["Lead Management"]).toEqual(["VIEW"]);
        expect(access["Student CRM"]["Student Management"]).toEqual(["VIEW"]);
    });

    it("should return Admin access for ADMIN role", () => {
        const access = userService.getDefaultModuleAccessByRole("ADMIN");

        expect(access.Marketing).toBeDefined();
        expect(access["Admin & Settings"]).toBeDefined();
    });
});

describe("user.service - getUsers", () => {
    it("should fetch all users", async () => {
        mockPrisma.user.findMany.mockResolvedValue([{ id: 1, email: "admin@test.com" }]);

        const result = await userService.getUsers();

        expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
            where: {},
            orderBy: { createdAt: "desc" },
        });

        expect(result).toHaveLength(1);
    });

    it("should fetch users by role", async () => {
        mockPrisma.user.findMany.mockResolvedValue([{ id: 2, role: "STUDENT" }]);

        await userService.getUsers("STUDENT" as any);

        expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
            where: { role: "STUDENT" },
            orderBy: { createdAt: "desc" },
        });
    });
});

describe("user.service - getUserById", () => {
    it("should fetch user by id with selected fields", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 1,
            email: "user@test.com",
        });

        const result = await userService.getUserById(1);

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
            select: expect.objectContaining({
                id: true,
                fullName: true,
                email: true,
                moduleAccess: true,
            }),
        });

        expect(result.id).toBe(1);
    });
});

describe("user.service - createUser", () => {
    it("should create user when email and phone are unique", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.findFirst.mockResolvedValue(null);

        mockPrisma.user.create.mockResolvedValue({
            id: 1,
            fullName: "Test Admin",
            email: "admin@test.com",
            phone: "9999999999",
            role: "ADMIN",
            isApproved: true,
        });

        const result = await userService.createUser({
            fullName: "Test Admin",
            email: " ADMIN@Test.com ",
            phone: "9999999999",
            password: "Temp@123",
            role: "ADMIN" as any,
        });

        expect(hashPassword).toHaveBeenCalledWith("Temp@123");

        expect(mockPrisma.user.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                fullName: "Test Admin",
                email: "admin@test.com",
                phone: "9999999999",
                role: "ADMIN",
                isActive: true,
                isApproved: true,
            }),
        });

        expect(sendCampaignEmail).toHaveBeenCalled();
        expect(safeNotify).toHaveBeenCalled();
        expect(result.id).toBe(1);
    });

    it("should throw error when email already exists", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 1,
            email: "admin@test.com",
        });

        await expect(
            userService.createUser({
                fullName: "Duplicate User",
                email: "admin@test.com",
                role: "ADMIN" as any,
            })
        ).rejects.toThrow("User with this email already exists");

        expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it("should throw error when phone already exists", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.findFirst.mockResolvedValue({
            id: 2,
            phone: "9999999999",
        });

        await expect(
            userService.createUser({
                fullName: "Duplicate Phone",
                email: "new@test.com",
                phone: "9999999999",
                role: "ADMIN" as any,
            })
        ).rejects.toThrow("User with this mobile number already exists");

        expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    

    it("should create AGENT as not approved", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.findFirst.mockResolvedValue(null);

        mockPrisma.user.create.mockResolvedValue({
            id: 3,
            fullName: "Agent User",
            email: "agent@test.com",
            role: "AGENT",
            isApproved: false,
        });

        await userService.createUser({
            fullName: "Agent User",
            email: "agent@test.com",
            role: "AGENT" as any,
        });

        expect(mockPrisma.user.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                role: "AGENT",
                isApproved: false,
            }),
        });

        expect(safeNotify).not.toHaveBeenCalled();
    });

    it("should create lead when STUDENT user is created", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.findFirst.mockResolvedValue(null);

        mockPrisma.user.create.mockResolvedValue({
            id: 10,
            fullName: "Student User",
            email: "student@test.com",
            phone: "8888888888",
            role: "STUDENT",
            isApproved: true,
        });

        await userService.createUser({
            fullName: "Student User",
            email: "student@test.com",
            phone: "8888888888",
            role: "STUDENT" as any,
        });

        expect(mockPrisma.lead.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                fullName: "Student User",
                email: "student@test.com",
                phone: "8888888888",
                studentUserId: 10,
                isStudentLoginCreated: true,
                status: "NEW",
                rating: "WARM",
            }),
        });
    });

    it("should reject invalid role", async () => {
        await expect(
            userService.createUser({
                fullName: "Invalid Role",
                email: "invalid@test.com",
                role: "SUPER_ADMIN" as any,
            })
        ).rejects.toThrow("Invalid role selected");
    });
});

describe("user.service - updateUser", () => {
    it("should update user details", async () => {
        mockPrisma.user.update.mockResolvedValue({
            id: 1,
            fullName: "Updated User",
            role: "ADMIN",
        });

        const result = await userService.updateUser(1, {
            fullName: "Updated User",
        });

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: {
                fullName: "Updated User",
            },
        });

        expect(result.fullName).toBe("Updated User");
    });

    it("should sync counsellor assignment to lead when student counsellorId is updated", async () => {
        mockPrisma.user.update.mockResolvedValue({
            id: 10,
            fullName: "Student User",
            role: "STUDENT",
            counsellorId: 5,
        });

        await userService.updateUser(10, {
            counsellorId: 5,
        });

        expect(mockPrisma.lead.updateMany).toHaveBeenCalledWith({
            where: {
                studentUserId: 10,
            },
            data: {
                assignedCounsellorId: 5,
            },
        });
    });

    it("should not sync lead when non-student user is updated", async () => {
        mockPrisma.user.update.mockResolvedValue({
            id: 2,
            role: "ADMIN",
        });

        await userService.updateUser(2, {
            counsellorId: 5,
        });

        expect(mockPrisma.lead.updateMany).not.toHaveBeenCalled();
    });

    it("should send notification when agent approval changes from false to true", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 5,
            isApproved: false,
        });

        mockPrisma.user.update.mockResolvedValue({
            id: 5,
            fullName: "Agent User",
            role: "AGENT",
            isApproved: true,
        });

        await userService.updateUser(5, {
            isApproved: true,
        });

        expect(safeNotify).toHaveBeenCalledWith({
            recipientId: 5,
            templateKey: "welcome.user",
            vars: {
                name: "Agent User",
                role: "AGENT",
            },
        });
    });
});

describe("user.service - deactivateUser", () => {
    it("should deactivate user", async () => {
        mockPrisma.user.update.mockResolvedValue({
            id: 1,
            isActive: false,
        });

        const result = await userService.deactivateUser(1);

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: {
                isActive: false,
            },
        });

        expect(result.isActive).toBe(false);
    });
});

describe("user.service - getCounsellors", () => {
    it("should fetch active counsellors", async () => {
        mockPrisma.user.findMany.mockResolvedValue([
            {
                id: 1,
                fullName: "Counsellor One",
                role: "COUNSELLOR",
                isActive: true,
            },
        ]);

        const result = await userService.getCounsellors();

        expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
            where: {
                role: "COUNSELLOR",
                isActive: true,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
            },
            orderBy: {
                fullName: "asc",
            },
        });

        expect(result).toHaveLength(1);
    });
});