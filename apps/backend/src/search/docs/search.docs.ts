import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ErrorResponseViewDto } from '../../common/api/error-response.view-dto';
import { SearchPolicy } from '../search.policy';
import { SearchResultsViewDto } from '../view-dto/search-results.view-dto';

export const ApiSearch = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Поиск по заведениям и блюдам',
      description:
        'Один запрос — два вида ответа: заведения и блюда. Человек ищет ' +
        '«шаурма» и должен найти БЛЮДО, а не только заведение с этим словом ' +
        'в названии. Заведения ищутся по вхождению в название и по точному ' +
        'совпадению кухни, блюда — по вхождению в название (описание и ' +
        'состав не ищем: там это слово у половины меню). ' +
        `Выдача ограничена ${SearchPolicy.MAX_RESTAURANTS} заведениями и ` +
        `${SearchPolicy.MAX_DISHES} блюдами, постраничности нет. ` +
        'Позиции из стоп-листа показываются с isAvailable=false — как в меню. ' +
        'Доступно ГОСТЮ: искать можно до всякого входа.',
    }),
    ApiOkResponse({ type: SearchResultsViewDto }),
    ApiBadRequestResponse({
      description: `VALIDATION_ERROR — запрос короче ${SearchPolicy.MIN_QUERY_LENGTH} символов или длиннее ${SearchPolicy.MAX_QUERY_LENGTH}`,
      type: ErrorResponseViewDto,
    }),
  );
