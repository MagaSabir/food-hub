import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/api/decorators/current-user.decorator';
import { Roles } from '../auth/api/decorators/roles.decorator';
import { AccessTokenPayload } from '../auth/domain/types/access-token-payload';
import { FavoritesService } from './favorites.service';
import { AddFavoriteInputDto } from './input-dto/add-favorite.input-dto';
import { RestaurantListItemViewDto } from '../restaurants/api/view-dto/restaurant-list-item.view-dto';
import {
  ApiAddFavorite,
  ApiGetFavorites,
  ApiRemoveFavorite,
} from './docs/favorites.docs';

@ApiTags('favorites')
@Roles(Role.CLIENT)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiGetFavorites()
  list(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<RestaurantListItemViewDto[]> {
    return this.favoritesService.findMine(user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAddFavorite()
  add(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: AddFavoriteInputDto,
  ): Promise<void> {
    return this.favoritesService.add(user.sub, body.restaurantId);
  }

  @Delete(':restaurantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRemoveFavorite()
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
  ): Promise<void> {
    return this.favoritesService.remove(user.sub, restaurantId);
  }
}
