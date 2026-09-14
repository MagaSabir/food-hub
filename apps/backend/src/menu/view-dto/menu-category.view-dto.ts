import { ApiProperty } from '@nestjs/swagger';
import type { MenuCategoryWithItems } from '@foodhubme/shared';
import type { MenuCategory } from '@prisma/client';
import {
  MenuItemListItemViewDto,
  MenuItemWithGroupFlags,
} from './menu-item-list-item.view-dto';

export type MenuCategoryWithMenuItems = MenuCategory & {
  items: MenuItemWithGroupFlags[];
};

export class MenuCategoryViewDto implements MenuCategoryWithItems {
  @ApiProperty({
    format: 'uuid',
    example: '55555555-5555-5555-8555-555555555555',
  })
  id!: string;

  @ApiProperty({ example: 'Пицца' })
  name!: string;

  @ApiProperty({ type: [MenuItemListItemViewDto] })
  items!: MenuItemListItemViewDto[];

  static mapToView(
    category: MenuCategoryWithMenuItems,
    now: Date,
  ): MenuCategoryViewDto {
    const dto = new MenuCategoryViewDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.items = category.items.map((item) =>
      MenuItemListItemViewDto.mapToView(item, now),
    );
    return dto;
  }
}
