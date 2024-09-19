import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { errorMessageHandle } from "helpers/common/error-handle";
import { StudentService } from "service/student.service";
@Controller("student")
export default class StudentController {
    constructor(private readonly studentService: StudentService) {}

    @Get("/get-assign-no")
    async studentNo() {
        try {
            const response = await this.studentService.getStudentNo();
            return response;
        } catch (error) {
            errorMessageHandle(error, "studentNo");
        }
    }

    @Post("/add-student")
    async studentAdd(@Body() body: any) {
        try {
            const response = await this.studentService.addStudent(body);
            return response;
        } catch (error) {
            errorMessageHandle(error, "createStudent");
        }
    }

    @Put("/update-student/:studentId")
    async studentUpdate(@Param("studentId") studentId: string, @Body() body: any) {
        try {
            const response = await this.studentService.updateStudent(studentId, body);
            return response;
        } catch (error) {
            errorMessageHandle(error, "updateStudent");
        }
    }

    @Get("/get-studentById/:studentId")
    async studentgetbyId(@Param("studentId") studentId: string) {
        try {
            const response = await this.studentService.getStudentByid(studentId);
            return response;
        } catch (error) {
            errorMessageHandle(error, "getStudent");
        }
    }

    @Get("/getProfitSheet")
    async getProfitSheet(@Query("search") search: string) {
        try {
            const response = await this.studentService.profitSheet(search);
            return response;
        } catch (error) {
            errorMessageHandle(error, "createStudent");
        }
    }

    @Delete("/archive-student")
    async studentDelete(@Body() body: any) {
        try {
            const response = await this.studentService.deleteStudent(body);
            return response;
        } catch (error) {
            errorMessageHandle(error, "deleteStudent");
        }
    }

    @Post("/get-students")
    async studentFilter(@Body() body: any) {
        try {
            const response = await this.studentService.studentFilterService(body);
            return response;
        } catch (error) {
            errorMessageHandle(error, "getStudent");
        }
    }

    @Get("/get-students-time/:tutorId")
    async getstudentTime(@Body() body: any, @Param("tutorId") tutorId: string) {
        try {
            const response = await this.studentService.getStudentTime(body, tutorId);
            return response;
        } catch (error) {
            errorMessageHandle(error, "getStudent");
        }
    }

    @Get("/getDashboardCount")
    async getDashboardCount() {
        try {
            const response = await this.studentService.getDashboardCountService();
            return response;
        } catch (error) {
            errorMessageHandle(error, "Dashboard Count");
        }
    }
}
