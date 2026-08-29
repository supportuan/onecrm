import { describe, expect, it } from '@jest/globals';
import { applicationScopeWhere, studentSelfWhere } from '../modules/student-crm/scoping.js';

describe('applicationScopeWhere', () => {
  it('does not filter admins', () => {
    expect(applicationScopeWhere({ id: 1, role: 'GLOBAL_ADMIN' })).toEqual({});
  });

  it('scopes students to their linked profile', () => {
    expect(applicationScopeWhere({ id: 9, role: 'STUDENT', email: 'jane@test.com' })).toEqual({
      student: studentSelfWhere({ id: 9, email: 'jane@test.com' }),
    });
  });

  it('lets counsellors see assigned apps and all apps on students they can open', () => {
    expect(applicationScopeWhere({ id: 4, role: 'COUNSELLOR' })).toEqual({
      OR: [
        { assignedToId: 4 },
        {
          student: {
            deletedAt: null,
            OR: [
              { contactId: 4 },
              { applications: { some: { assignedToId: 4 } } },
            ],
          },
        },
      ],
    });
  });
});
