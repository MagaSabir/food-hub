import { ApiProperty } from '@nestjs/swagger';
import { ItemType, type MenuItemListItem } from '@foodhubme/shared';
import type { MenuItem, ModifierGroup } from '@prisma/client';
import { getEffectivePrice } from '../pricing';

export type MenuItemWithGroupFlags = MenuItem & {
  modifierGroups: Pick<ModifierGroup, 'isRequired'>[];
};

export class MenuItemListItemViewDto implements MenuItemListItem {
  @ApiProperty({
    format: 'uuid',
    example: '66666666-6666-5666-8666-666666666666',
  })
  id!: string;

  @ApiProperty({ example: 'Пицца Маргарита' })
  name!: string;

  @ApiProperty({ nullable: true, type: String, example: null })
  description!: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    example: 'Томатный соус, моцарелла, свежий базилик',
  })
  composition!: string | null;

  @ApiProperty({ enum: ItemType, example: ItemType.DISH })
  itemType!: ItemType;

  @ApiProperty({ nullable: true, type: String, example: '480 г' })
  weight!: string | null;

  @ApiProperty({ nullable: true, type: String, example: null })
  volume!: string | null;

  @ApiProperty({ nullable: true, type: Number, example: 1100 })
  calories!: number | null;

  @ApiProperty({ example: 590, description: 'Цена сейчас, с учётом скидки, ₽' })
  price!: number;

  @ApiProperty({
    nullable: true,
    type: Number,
    example: null,
    description: 'Зачёркнутая цена; null — скидки нет',
  })
  oldPrice!: number | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Первая фотография',
  })
  photoUrl!: string | null;

  @ApiProperty({ example: true, description: 'false — стоп-лист' })
  isAvailable!: boolean;

  @ApiProperty({ example: true })
  hasModifiers!: boolean;

  @ApiProperty({
    example: false,
    description: 'Есть обязательные группы → «+» открывает шторку выбора',
  })
  hasRequiredModifiers!: boolean;

  protected static fill<T extends MenuItemListItemViewDto>(
    dto: T,
    item: MenuItemWithGroupFlags,
    now: Date,
  ): T {
    const { price, oldPrice } = getEffectivePrice(item, now);

    dto.id = item.id;
    dto.name = item.name;
    dto.description = item.description;
    dto.composition = item.composition;
    dto.itemType = item.itemType as ItemType;
    dto.weight = item.weight;
    dto.volume = item.volume;
    dto.calories = item.calories;
    dto.price = price.toNumber();
    dto.oldPrice = oldPrice?.toNumber() ?? null;
    dto.photoUrl = item.photos[0] ?? null;
    dto.isAvailable = item.isAvailable;
    dto.hasModifiers = item.modifierGroups.length > 0;
    dto.hasRequiredModifiers = item.modifierGroups.some((g) => g.isRequired);
    return dto;
  }

  static mapToView(
    item: MenuItemWithGroupFlags,
    now: Date,
  ): MenuItemListItemViewDto {
    return MenuItemListItemViewDto.fill(
      new MenuItemListItemViewDto(),
      item,
      now,
    );
  }
}
