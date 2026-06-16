import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockPrisma = {
    lead: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    user: {
        update: jest.fn(),
    },
    $transaction: jest.fn(),
};

jest.unstable_mockModule("../prisma.js", () => ({
    prisma: mockPrisma,
}));

const { validateDuplicateLead } = await import("../utils/validation.js");
const marketingService = await import("../modules/marketing/services/marketing.service.js");

beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
    });
});

describe("Lead duplicate validation", () => {
    it("should allow lead when email and phone are unique", async () => {
        mockPrisma.lead.findFirst.mockResolvedValue(null);

        await expect(
            validateDuplicateLead("test@example.com", "9999999999")
        ).resolves.toBeUndefined();
    });

    it("should throw error for duplicate email", async () => {
        mockPrisma.lead.findFirst.mockResolvedValue({
            id: 1,
            email: "test@example.com",
            phone: "9999999999",
        });

        await expect(
            validateDuplicateLead("test@example.com", "8888888888")
        ).rejects.toThrow("Lead with this email already exists");
    });

    it("should throw error for duplicate phone", async () => {
        mockPrisma.lead.findFirst.mockResolvedValue({
            id: 1,
            email: "old@example.com",
            phone: "9999999999",
        });

        await expect(
            validateDuplicateLead("new@example.com", "9999999999")
        ).rejects.toThrow("Lead with this phone number already exists");
    });
});

describe("createLead", () => {
    it("should create lead when email and phone are unique", async () => {
        mockPrisma.lead.findFirst.mockResolvedValue(null);

        mockPrisma.lead.create.mockResolvedValue({
            id: 1,
            fullName: "Test Student",
            email: "test@example.com",
            phone: "9999999999",
        });

        const result = await marketingService.createLead({
            fullName: "Test Student",
            email: " test@example.com ",
            phone: " 9999999999 ",
        });

        expect(mockPrisma.lead.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    email: "test@example.com",
                    phone: "9999999999",
                }),
            })
        );

        expect(result.id).toBe(1);
    });

    it("should not create lead if duplicate exists", async () => {
        mockPrisma.lead.findFirst.mockResolvedValue({
            id: 1,
            email: "test@example.com",
            phone: "9999999999",
        });

        await expect(
            marketingService.createLead({
                fullName: "Duplicate Student",
                email: "test@example.com",
                phone: "8888888888",
            })
        ).rejects.toThrow("Lead with this email already exists");

        expect(mockPrisma.lead.create).not.toHaveBeenCalled();
    });
});

describe("updateLead", () => {
    it("should update lead when no duplicate exists", async () => {
        mockPrisma.lead.findFirst
            .mockResolvedValueOnce({
                id: 1,
                email: "old@example.com",
                phone: "9999999999",
                studentUserId: null,
            })
            .mockResolvedValueOnce(null);

        mockPrisma.lead.update.mockResolvedValue({
            id: 1,
            email: "new@example.com",
            phone: "8888888888",
            studentUserId: null,
        });

        const result = await marketingService.updateLead(1, {
            email: "new@example.com",
            phone: "8888888888",
        });

        expect(result.email).toBe("new@example.com");
        expect(mockPrisma.lead.update).toHaveBeenCalled();
    });

    it("should block update if email already exists on another lead", async () => {
        mockPrisma.lead.findFirst
            .mockResolvedValueOnce({
                id: 1,
                email: "old@example.com",
                phone: "9999999999",
            })
            .mockResolvedValueOnce({
                id: 2,
                email: "used@example.com",
                phone: "7777777777",
            });

        await expect(
            marketingService.updateLead(1, {
                email: "used@example.com",
            })
        ).rejects.toThrow("Lead with this email already exists");

        expect(mockPrisma.lead.update).not.toHaveBeenCalled();
    });

    it("should sync counsellorId to user table when lead has studentUserId", async () => {
        mockPrisma.lead.findFirst
            .mockResolvedValueOnce({
                id: 1,
                email: "student@example.com",
                phone: "9999999999",
                studentUserId: 10,
            })
            .mockResolvedValueOnce(null);

        mockPrisma.lead.update.mockResolvedValue({
            id: 1,
            email: "student@example.com",
            phone: "9999999999",
            assignedCounsellorId: 5,
            studentUserId: 10,
        });

        await marketingService.updateLead(1, {
            assignedCounsellorId: 5,
        });

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: {
                counsellorId: 5,
            },
        });
    });
});

describe("assignCounsellor", () => {
    it("should update lead counsellor and sync user counsellor when studentUserId exists", async () => {
        mockPrisma.lead.findFirst.mockResolvedValue({
            id: 1,
            studentUserId: 10,
            deletedAt: null,
        });

        mockPrisma.lead.update.mockResolvedValue({
            id: 1,
            assignedCounsellorId: 5,
            studentUserId: 10,
        });

        await marketingService.assignCounsellor(1, 5, 99);

        expect(mockPrisma.lead.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 1 },
                data: {
                    assignedCounsellorId: 5,
                    assignedById: 99,
                },
            })
        );

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: {
                counsellorId: 5,
            },
        });
    });
});