import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FeaturesService } from './features.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { Roles,AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller('features')
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  // Create the feature --> ( Only admin )
  @Post()
  @Roles(['admin'])
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() createFeatureDto: CreateFeatureDto) {
    return this.featuresService.create(createFeatureDto);
  }

  // Read Features --> ( Everyone )
  @Get()
  @AllowAnonymous()
  async findAll() {
    return this.featuresService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.featuresService.findOne(id);
  }

  // Update and Delete --> ( Only admin )
  @Put(':id')
  @Roles(['admin'])
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id') id: string,
    @Body() updateFeatureDto: Partial<CreateFeatureDto>,
  ) {
    return this.featuresService.update(id, updateFeatureDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(['admin'])
  async remove(@Param('id') id: string) {
    await this.featuresService.remove(id);
  }
}
