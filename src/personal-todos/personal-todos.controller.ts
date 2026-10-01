import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common"
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator"
import { Permissions } from "../common/decorators/permissions.decorator"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard"
import { PermissionsGuard } from "../common/guards/permissions.guard"
import { CreatePersonalTodoDto } from "./dto/create-personal-todo.dto"
import { FindPersonalTodosDto } from "./dto/find-personal-todos.dto"
import { UpdatePersonalTodoDto } from "./dto/update-personal-todo.dto"
import { PersonalTodosService } from "./personal-todos.service"

@Controller("personal-todos")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PersonalTodosController {
  constructor(private readonly service: PersonalTodosService) {}

  @Get()
  findAll(@Query() query: FindPersonalTodosDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findAll(query, user)
  }

  @Post()
  create(@Body() dto: CreatePersonalTodoDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.create(dto, user)
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePersonalTodoDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.update(id, dto, user)
  }

  @Patch(":id/complete")
  complete(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.complete(id, user)
  }

  @Patch(":id/reopen")
  reopen(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.reopen(id, user)
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.remove(id, user)
  }

  @Post(":id/convert-to-task")
  @Permissions("task:create")
  convertToTask(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.convertToTask(id, user)
  }
}
