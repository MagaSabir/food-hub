import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensViewDto {
  @ApiProperty({
    description: 'JWT для заголовка Authorization',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…',
  })
  accessToken!: string;

  @ApiProperty({
    example: 'Bearer',
    description: 'Схема заголовка Authorization',
  })
  tokenType!: string;

  static create(accessToken: string): AuthTokensViewDto {
    const dto = new AuthTokensViewDto();
    dto.accessToken = accessToken;
    dto.tokenType = 'Bearer';
    return dto;
  }
}
