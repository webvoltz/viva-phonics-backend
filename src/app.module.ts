import { ApiAuthMiddleware, ApiNotFoundMiddleware, ErrorHandlerMiddleware } from "./middleware";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import FinanceController from "controller/finance.controller";
import StudentController from "controller/student.controller";
import { S3FileUploadService } from "./helpers/fileHandler";
import UserController from "./controller/admin.controller";
import TutorController from "controller/tutor.controller";
import { StudentService } from "service/student.service";
import { FinanceService } from "service/finance.service";
import { TutorService } from "service/tutor.service";
import { AdminService } from "service/admin.service";
import { excludeArray } from "./app.module.config";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
    imports: [ScheduleModule.forRoot()],
    controllers: [UserController, StudentController, TutorController, FinanceController],
    providers: [S3FileUploadService, AdminService, StudentService, TutorService, FinanceService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(ApiAuthMiddleware)
            .exclude(...excludeArray)
            .forRoutes("*");

        consumer.apply(ApiNotFoundMiddleware).forRoutes("*");
        consumer.apply(ErrorHandlerMiddleware).forRoutes("*");
    }
}
