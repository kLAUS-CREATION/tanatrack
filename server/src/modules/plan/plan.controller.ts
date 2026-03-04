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
} from '@nestjs/common';
import { PlanService } from './plan.service';
import { CreatePlanDto, UpdatePlanFeaturesDto } from './dto/plan.dto';
import { Roles, AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @Roles(['admin'])
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() createPlanDto: CreatePlanDto) {
    return this.planService.create(createPlanDto);
  }

  @Get()
  @AllowAnonymous()
  async findAll() {
    return this.planService.findAll();
  }

  @Get(':id')
  @AllowAnonymous()
  async findOne(@Param('id') id: string) {
    return this.planService.findOne(id);
  }

  @Put(':id')
  @Roles(['admin'])
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(
    @Param('id') id: string,
    @Body() updatePlanDto: Partial<CreatePlanDto>,
  ) {
    return this.planService.update(id, updatePlanDto);
  }

  // Use this endpoint to specifically update the limits/features of a plan
  @Put(':id/features')
  @Roles(['admin'])
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async syncFeatures(
    @Param('id') id: string,
    @Body() dto: UpdatePlanFeaturesDto,
  ) {
    return this.planService.syncFeatures(id, dto);
  }

  @Delete(':id')
  @Roles(['admin'])
  async remove(@Param('id') id: string) {
    return this.planService.remove(id);
  }
}
