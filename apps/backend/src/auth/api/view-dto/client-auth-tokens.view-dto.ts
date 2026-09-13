import { ApiProperty } from '@nestjs/swagger';
import type { ClientAuthTokens } from '@foodhubme/shared';
import { AuthTokens } from '../../domain/types/auth-subject';

export class ClientAuthTokensViewDto implements ClientAuthTokens {
  @ApiProperty({ description: 'JWT для заголовка Authorization' })
  accessToken!: string;

  @ApiProperty({
    description:
      'Хранить ТОЛЬКО в secure-store, не в AsyncStorage и не в памяти JS',
  })
  refreshToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  static create(tokens: AuthTokens): ClientAuthTokensViewDto {
    const dto = new ClientAuthTokensViewDto();
    dto.accessToken = tokens.accessToken;
    dto.refreshToken = tokens.refreshToken;
    dto.tokenType = 'Bearer';
    return dto;
  }
}
