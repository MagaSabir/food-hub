import type { UserAddressView } from '@foodhubme/shared';
import { ApiProperty } from '@nestjs/swagger';
import type { UserAddress } from '@prisma/client';

export class UserAddressViewDto implements UserAddressView {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'пр. Путина, 12' })
  address!: string;

  @ApiProperty({
    nullable: true,
    type: String,
    example: 'Грозный',
    description:
      'Населённый пункт. null — адрес сохранён до Шага 7.2 и его не знает; ' +
      'приложение подставит город пилота.',
  })
  locality!: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    example: 'подъезд 2, этаж 5, код 45',
    description: 'Свободный текст для курьера; null — не указано',
  })
  details!: string | null;

  @ApiProperty({ example: 43.3169 })
  latitude!: number;

  @ApiProperty({ example: 45.6981 })
  longitude!: number;

  @ApiProperty({
    example: true,
    description: 'Подставлять при запуске. Такой ровно один — следит сервер.',
  })
  isDefault!: boolean;

  static mapToView(row: UserAddress): UserAddressViewDto {
    const dto = new UserAddressViewDto();
    dto.id = row.id;
    dto.address = row.address;
    dto.locality = row.locality;
    dto.details = row.details;
    dto.latitude = row.latitude;
    dto.longitude = row.longitude;
    dto.isDefault = row.isDefault;
    return dto;
  }
}
