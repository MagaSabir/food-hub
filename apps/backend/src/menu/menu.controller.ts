import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/api/decorators/public.decorator';
import { MenuService } from './menu.service';
import { ApiGetBrandMenu, ApiGetMenuItem } from './docs/menu.docs';
import { MenuCategoryViewDto } from './view-dto/menu-category.view-dto';
import { MenuItemDetailsViewDto } from './view-dto/menu-item-details.view-dto';

@ApiTags('menu')
@Controller()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Public()
  @Get('restaurants/by-slug/:slug/menu')
  @ApiGetBrandMenu()
  brandMenu(@Param('slug') slug: string): Promise<MenuCategoryViewDto[]> {
    return this.menuService.findBrandMenu(slug);
  }

  @Public()
  @Get('menu-items/:id')
  @ApiGetMenuItem()
  menuItem(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MenuItemDetailsViewDto> {
    return this.menuService.findMenuItem(id);
  }
}
