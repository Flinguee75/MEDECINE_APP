import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ResultsService } from './results.service';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { ReviewResultDto } from './dto/review-result.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('results')
@UseGuards(AuthGuard)
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.BIOLOGIST, Role.RADIOLOGIST, Role.ADMIN)
  async create(@Body() createDto: CreateResultDto) {
    const result = await this.resultsService.create(createDto);
    return {
      data: result,
      message: 'Résultat créé avec succès',
    };
  }

  @Get()
  async findAll(@Query('prescriptionId') prescriptionId?: string) {
    const results = await this.resultsService.findAll({ prescriptionId });
    return { data: results };
  }

  @Get('pending-review')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR, Role.ADMIN)
  async getPendingReview(@CurrentUser() userId: string) {
    const results = await this.resultsService.getPendingReviewForDoctor(userId);
    return { data: results };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.resultsService.findOne(id);
    return { data: result };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.BIOLOGIST, Role.RADIOLOGIST, Role.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdateResultDto) {
    const result = await this.resultsService.update(id, updateDto);
    return {
      data: result,
      message: 'Résultat mis à jour avec succès',
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    await this.resultsService.remove(id);
    return { message: 'Résultat supprimé avec succès' };
  }

  @Patch(':id/review')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR, Role.ADMIN)
  async review(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: ReviewResultDto,
  ) {
    const result = await this.resultsService.review(id, userId, dto);
    return {
      data: result,
      message: 'Résultat révisé avec succès',
    };
  }
}
