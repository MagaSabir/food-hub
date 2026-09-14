import type { AuthMe } from '@foodhubme/shared';
import { Role } from '@foodhubme/shared';
import { ApiProperty } from '@nestjs/swagger';
import type { PlatformAdmin, StaffUser, User } from '@prisma/client';

export class MeViewDto implements AuthMe {
  @ApiProperty({
    format: 'uuid',
    example: '44444444-0000-0000-0000-000000000001',
  })
  id!: string;

  @ApiProperty({ enum: Role, example: Role.RESTAURANT_OWNER })
  role!: Role;

  @ApiProperty({
    nullable: true,
    type: String,
    example: 'owner@syrovarnya.local',
    description: 'Логин сотрудника или админа; у клиента (2.5) — null',
  })
  email!: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    example: '+79280000000',
    description: 'У клиента — его номер; у сотрудников и админов null',
  })
  phone!: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Имя клиента; null, пока не спросили',
  })
  name!: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Только у сотрудников ресторана',
  })
  restaurantId!: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'null = доступ ко всем точкам бренда',
  })
  branchId!: string | null;

  static fromStaff(staff: StaffUser): MeViewDto {
    const dto = new MeViewDto();
    dto.id = staff.id;
    dto.role = Role[staff.role];
    dto.email = staff.email;
    dto.phone = null;
    dto.name = null;
    dto.restaurantId = staff.restaurantId;
    dto.branchId = staff.branchId;
    return dto;
  }

  static fromAdmin(admin: PlatformAdmin): MeViewDto {
    const dto = new MeViewDto();
    dto.id = admin.id;
    dto.role = Role.PLATFORM_ADMIN;
    dto.email = admin.email;
    dto.phone = null;
    dto.name = null;
    dto.restaurantId = null;
    dto.branchId = null;
    return dto;
  }

  static fromUser(user: User): MeViewDto {
    const dto = new MeViewDto();
    dto.id = user.id;
    dto.role = Role.CLIENT;
    dto.email = null;
    dto.phone = user.phone;
    dto.name = user.name;
    dto.restaurantId = null;
    dto.branchId = null;
    return dto;
  }
}
