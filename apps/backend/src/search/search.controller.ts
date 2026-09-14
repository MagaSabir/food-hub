import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/api/decorators/public.decorator';
import { ApiSearch } from './docs/search.docs';
import { SearchQueryInputDto } from './input-dto/search-query.input-dto';
import { SearchService } from './search.service';
import { SearchResultsViewDto } from './view-dto/search-results.view-dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Public()
  @Get()
  @ApiSearch()
  find(@Query() query: SearchQueryInputDto): Promise<SearchResultsViewDto> {
    return this.search.search(query.q);
  }
}
