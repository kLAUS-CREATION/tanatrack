import { createAccessControl } from 'better-auth/plugins/access';

const statement = {
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'delete',
    'set-password',
  ],
  session: ['list', 'revoke', 'delete'],
} as const;

const ac = createAccessControl(statement);

export const owner = ac.newRole({
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'delete',
    'set-password',
  ],
  session: ['list', 'revoke', 'delete'],
});

export const employee = ac.newRole({
  user: ['list'],
  session: ['list'],
});

export const admin = ac.newRole({
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'delete',
    'set-password',
  ],
  session: ['list', 'revoke', 'delete'],
});
