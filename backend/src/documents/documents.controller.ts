import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SECRETARY, Role.DOCTOR, Role.BIOLOGIST, Role.ADMIN)
  async create(@Body() createDto: CreateDocumentDto, @CurrentUser() userId: string) {
    const document = await this.documentsService.create(createDto, userId);
    return {
      data: document,
      message: 'Document ajouté avec succès',
    };
  }

  @Get()
  async findAll(@Query('patientId') patientId?: string) {
    const documents = await this.documentsService.findAll({ patientId });
    return { data: documents };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const document = await this.documentsService.findOne(id);
    return { data: document };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SECRETARY, Role.DOCTOR, Role.BIOLOGIST, Role.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdateDocumentDto) {
    const document = await this.documentsService.update(id, updateDto);
    return {
      data: document,
      message: 'Document mis à jour avec succès',
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SECRETARY, Role.DOCTOR, Role.BIOLOGIST, Role.ADMIN)
  async remove(@Param('id') id: string) {
    await this.documentsService.remove(id);
    return { message: 'Document supprimé avec succès' };
  }
}
