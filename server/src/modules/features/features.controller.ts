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
import { OrgRoles } from '@thallesp/nestjs-better-auth'; // ← key import

@Controller('features')
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  // ── CREATE ──────────────────────────────────────────────
  // ONLY org owner/admin of the ACTIVE organization can create features
  @Post()
  @OrgRoles(['owner', 'admin']) // ← enforces org role + active org
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() createFeatureDto: CreateFeatureDto) {
    return this.featuresService.create(createFeatureDto);
  }

  // ── READ (public or optional, your choice) ──────────────
  // Example: allow anyone authenticated to list features (or make @AllowAnonymous())
  @Get()
  // @AllowAnonymous()
  async findAll() {
    return this.featuresService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.featuresService.findOne(id);
  }

  // ── UPDATE & DELETE ─────────────────────────────────────
  @Put(':id')
  @OrgRoles(['owner', 'admin'])
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(
    @Param('id') id: string,
    @Body() updateFeatureDto: Partial<CreateFeatureDto>,
  ) {
    return this.featuresService.update(id, updateFeatureDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @OrgRoles(['owner', 'admin'])
  async remove(@Param('id') id: string) {
    await this.featuresService.remove(id);
  }
}
