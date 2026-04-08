import 'reflect-metadata';
import { UserRole } from '@prisma/client';
import { ROLES_KEY, Roles } from './roles.decorator';

class TestController {
  @Roles(UserRole.ADMIN, UserRole.USER)
  handler(): void {}
}

describe('Roles', () => {
  it('attaches ROLES_KEY metadata to the handler', () => {
    const actualRoles = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype.handler,
    );
    expect(actualRoles).toEqual([UserRole.ADMIN, UserRole.USER]);
  });
});
