import {
  CreateOrderItemRequest,
  CreateOrderRequest,
  DeliveryAddressRequest,
  OrderType,
  PaymentMethod,
} from '@foodhubme/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDefined,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { UUID_PATTERN } from '../../../common/validation/uuid';
import { normalizePhone } from '../../../auth/domain/rules/phone';
import { OrderPolicy } from '../../domain/policies/order.policy';

export class CreateOrderItemInputDto implements CreateOrderItemRequest {
  @ApiProperty({
    example: '3f1a2b3c-4d5e-6f70-8901-234567890abc',
    description: 'id позиции меню (из меню бренда).',
  })
  @Matches(UUID_PATTERN, { message: 'menuItemId: некорректный id позиции' })
  menuItemId!: string;

  @ApiProperty({
    example: 2,
    minimum: 1,
    maximum: OrderPolicy.MAX_QUANTITY_PER_LINE,
    description: 'Сколько штук этой позиции с этим набором опций.',
  })
  @IsInt({ message: 'quantity: целое число' })
  @Min(1, { message: 'quantity: минимум 1' })
  @Max(OrderPolicy.MAX_QUANTITY_PER_LINE, {
    message: `quantity: максимум ${OrderPolicy.MAX_QUANTITY_PER_LINE}`,
  })
  quantity!: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['7c9e6679-7425-40de-944b-e07fc1f90ae7'],
    description:
      'id выбранных опций модификаторов. Порядок не важен, повторы запрещены.',
  })
  @IsOptional()
  @IsArray({ message: 'optionIds: список id' })
  @ArrayMaxSize(OrderPolicy.MAX_OPTIONS_PER_LINE, {
    message: `optionIds: максимум ${OrderPolicy.MAX_OPTIONS_PER_LINE} опций на позицию`,
  })
  @ArrayUnique({ message: 'optionIds: опции не должны повторяться' })
  @Matches(UUID_PATTERN, {
    each: true,
    message: 'optionIds: некорректный id опции',
  })
  optionIds?: string[];
}

export class DeliveryAddressInputDto implements DeliveryAddressRequest {
  @ApiProperty({
    example: 'г. Грозный, пр. Путина, 12',
    description:
      'Строка адреса — по ней поедет курьер (уйдёт в заказ снимком).',
  })
  @IsString({ message: 'delivery.address: строка' })
  @MaxLength(OrderPolicy.MAX_ADDRESS_LENGTH)
  @Matches(/\S/, { message: 'delivery.address: адрес не может быть пустым' })
  address!: string;

  @ApiPropertyOptional({
    example: 'подъезд 2, этаж 5, домофон 12К',
    description: 'Уточнения, которых нет в адресе с карты.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(OrderPolicy.MAX_ADDRESS_DETAILS_LENGTH)
  details?: string;

  @ApiProperty({
    example: 43.3169,
    description: 'Широта точки доставки — по ней считается расстояние и цена.',
  })
  @IsNumber({}, { message: 'delivery.latitude: число' })
  @Min(OrderPolicy.LATITUDE_RANGE.MIN)
  @Max(OrderPolicy.LATITUDE_RANGE.MAX)
  latitude!: number;

  @ApiProperty({
    example: 45.6981,
    description: 'Долгота точки доставки.',
  })
  @IsNumber({}, { message: 'delivery.longitude: число' })
  @Min(OrderPolicy.LONGITUDE_RANGE.MIN)
  @Max(OrderPolicy.LONGITUDE_RANGE.MAX)
  longitude!: number;
}

export class CreateOrderInputDto implements CreateOrderRequest {
  @ApiProperty({
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    description: 'Бренд, из меню которого набрана корзина.',
  })
  @Matches(UUID_PATTERN, { message: 'restaurantId: некорректный id бренда' })
  restaurantId!: string;

  @ApiProperty({
    enum: OrderType,
    example: OrderType.DELIVERY,
    description: 'Как получаем: доставка, самовывоз или в зале.',
  })
  @IsEnum(OrderType, { message: 'orderType: DELIVERY, PICKUP или DINE_IN' })
  orderType!: OrderType;

  @ApiPropertyOptional({
    example: '2f8a1c3e-5b7d-4a9f-8c1e-3d5b7a9f1c3e',
    description:
      'Точка исполнения. ОБЯЗАТЕЛЬНА для PICKUP и DINE_IN (клиент сам ' +
      'выбирает, куда приедет). Для DELIVERY точку подбирает backend по адресу.',
  })
  @ValidateIf((o: CreateOrderInputDto) => o.orderType !== OrderType.DELIVERY)
  @Matches(UUID_PATTERN, {
    message: 'branchId: обязателен для самовывоза и заказа в зале',
  })
  branchId?: string;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    description: 'Чем платит клиент. Онлайн-оплата заработает на Этапе 11.',
  })
  @IsEnum(PaymentMethod, { message: 'paymentMethod: CASH или ONLINE' })
  paymentMethod!: PaymentMethod;

  @ApiProperty({
    type: [CreateOrderItemInputDto],
    description: 'Строки корзины. Пустой заказ оформить нельзя.',
  })
  @IsArray({ message: 'items: список позиций' })
  @ArrayMinSize(1, {
    message: 'items: в заказе должна быть хотя бы одна позиция',
  })
  @ArrayMaxSize(OrderPolicy.MAX_LINES, {
    message: `items: максимум ${OrderPolicy.MAX_LINES} позиций в заказе`,
  })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemInputDto)
  items!: CreateOrderItemInputDto[];

  @ApiPropertyOptional({
    type: DeliveryAddressInputDto,
    description: 'Куда везти. Обязателен для DELIVERY, иначе игнорируется.',
  })
  @ValidateIf((o: CreateOrderInputDto) => o.orderType === OrderType.DELIVERY)
  @IsDefined({ message: 'delivery: адрес обязателен для доставки' })
  @ValidateNested()
  @Type(() => DeliveryAddressInputDto)
  delivery?: DeliveryAddressInputDto;

  @ApiPropertyOptional({
    example: '+79280000000',
    description:
      'Телефон для связи. Не прислали — возьмём подтверждённый номер профиля.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? (normalizePhone(value) ?? value) : value,
  )
  @Matches(/^\+7\d{10}$/, { message: 'contactPhone: некорректный номер' })
  contactPhone?: string;

  @ApiPropertyOptional({
    example: 'Домофон не работает, позвоните',
    description: 'Комментарий кухне и курьеру.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(OrderPolicy.MAX_COMMENT_LENGTH, {
    message: `comment: максимум ${OrderPolicy.MAX_COMMENT_LENGTH} символов`,
  })
  comment?: string;
}
