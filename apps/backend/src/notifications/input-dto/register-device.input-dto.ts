import type { DevicePlatform, RegisterDeviceRequest } from '@foodhubme/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { EXPO_PUSH_TOKEN_PATTERN } from '../push/expo-push-token';

export class RegisterDeviceInputDto implements RegisterDeviceRequest {
  @ApiProperty({
    description:
      'Push-адрес устройства от Expo. Формат ExponentPushToken[...] — ' +
      'приложение получает его у Expo Notifications при первом запуске.',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    maxLength: 200,
  })
  @IsString({ message: 'expoPushToken: строка' })
  @MaxLength(200, { message: 'expoPushToken: слишком длинный' })
  @Matches(EXPO_PUSH_TOKEN_PATTERN, {
    message: 'expoPushToken: не похож на push-токен Expo',
  })
  expoPushToken!: string;

  @ApiPropertyOptional({
    enum: ['ios', 'android'],
    description: 'Откуда пришёл токен — для разбора жалоб на недоставку.',
  })
  @IsOptional()
  @IsIn(['ios', 'android'], { message: 'platform: ios или android' })
  platform?: DevicePlatform;
}
