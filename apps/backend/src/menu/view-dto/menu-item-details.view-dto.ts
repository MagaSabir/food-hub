import { ApiProperty } from '@nestjs/swagger';
import {
  ModifierType,
  type MenuItemDetails,
  type ModifierGroupInfo,
  type ModifierOptionInfo,
} from '@foodhubme/shared';
import type { MenuItem, ModifierGroup, ModifierOption } from '@prisma/client';
import { MenuItemListItemViewDto } from './menu-item-list-item.view-dto';

export type MenuItemWithModifiers = MenuItem & {
  modifierGroups: (ModifierGroup & { options: ModifierOption[] })[];
};

export class ModifierOptionViewDto implements ModifierOptionInfo {
  @ApiProperty({
    format: 'uuid',
    example: '77777777-7777-5777-8777-777777777771',
  })
  id!: string;

  @ApiProperty({ example: '30 см' })
  name!: string;

  @ApiProperty({
    example: 150,
    description: 'Доплата, ₽. Может быть отрицательной («без соуса»)',
  })
  priceDelta!: number;

  @ApiProperty({
    example: true,
    description: 'false — вариант кончился; показываем неактивным',
  })
  isAvailable!: boolean;

  static mapToView(option: ModifierOption): ModifierOptionViewDto {
    const dto = new ModifierOptionViewDto();
    dto.id = option.id;
    dto.name = option.name;
    dto.priceDelta = option.priceDelta.toNumber();
    dto.isAvailable = option.isAvailable;
    return dto;
  }
}

export class ModifierGroupViewDto implements ModifierGroupInfo {
  @ApiProperty({
    format: 'uuid',
    example: '88888888-8888-5888-8888-888888888881',
  })
  id!: string;

  @ApiProperty({ example: 'Размер' })
  name!: string;

  @ApiProperty({ enum: ModifierType, example: ModifierType.SINGLE })
  type!: ModifierType;

  @ApiProperty({ example: true })
  isRequired!: boolean;

  @ApiProperty({ example: 1 })
  minSelections!: number;

  @ApiProperty({
    nullable: true,
    type: Number,
    example: 1,
    description: 'null = без верхней границы',
  })
  maxSelections!: number | null;

  @ApiProperty({ type: [ModifierOptionViewDto] })
  options!: ModifierOptionViewDto[];

  static mapToView(
    group: ModifierGroup & { options: ModifierOption[] },
  ): ModifierGroupViewDto {
    const dto = new ModifierGroupViewDto();
    dto.id = group.id;
    dto.name = group.name;
    dto.type = group.type as ModifierType;
    dto.isRequired = group.isRequired;
    dto.minSelections = group.minSelections;
    dto.maxSelections = group.maxSelections;
    dto.options = group.options.map((o) => ModifierOptionViewDto.mapToView(o));
    return dto;
  }
}

export class MenuItemDetailsViewDto
  extends MenuItemListItemViewDto
  implements MenuItemDetails
{
  @ApiProperty({ type: [String], description: 'Все фото; первое — обложка' })
  photos!: string[];

  @ApiProperty({ type: [ModifierGroupViewDto] })
  modifierGroups!: ModifierGroupViewDto[];

  static mapToDetails(
    item: MenuItemWithModifiers,
    now: Date,
  ): MenuItemDetailsViewDto {
    const dto = MenuItemListItemViewDto.fill(
      new MenuItemDetailsViewDto(),
      item,
      now,
    );
    dto.photos = item.photos;
    dto.modifierGroups = item.modifierGroups.map((g) =>
      ModifierGroupViewDto.mapToView(g),
    );
    return dto;
  }
}
