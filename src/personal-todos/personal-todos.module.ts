import { Module } from "@nestjs/common"
import { CompanyAccessModule } from "../companies/company-access.module"
import { PrismaModule } from "../prisma/prisma.module"
import { TasksModule } from "../tasks/tasks.module"
import { PersonalTodoReminderService } from "./personal-todo-reminder.service"
import { PersonalTodosController } from "./personal-todos.controller"
import { PersonalTodosService } from "./personal-todos.service"

@Module({
  imports: [PrismaModule, TasksModule, CompanyAccessModule],
  controllers: [PersonalTodosController],
  providers: [PersonalTodosService, PersonalTodoReminderService],
  exports: [PersonalTodosService],
})
export class PersonalTodosModule {}
