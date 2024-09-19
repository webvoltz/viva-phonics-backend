import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { errorMessageHandle } from "helpers/common/error-handle";
import { TutorService } from "service/tutor.service";

@Controller("tutor")
export default class TutorController {
    constructor(private readonly tutorService: TutorService) {}
    @Get("/get-tutors")
    async tutorGet() {
        try {
            const response = await this.tutorService.gettutors();
            return response;
        } catch (error) {
            errorMessageHandle(error, "tutorGet");
        }
    }
    @Post("/get-all-tutors")
    async getalltutors(@Body() body: any) {
        try {
            const response = await this.tutorService.getalltutors(body);
            return response;
        } catch (error) {
            errorMessageHandle(error, "tutorGet");
        }
    }

    @Post("/add-tutor")
    async tutorAdd(@Body() body: any) {
        try {
            const response = await this.tutorService.addtutor(body);
            return response;
        } catch (error) {
            errorMessageHandle(error, "createTutor");
        }
    }

    @Put("/update-tutor/:tutorId")
    async updateTutor(@Body() body: any, @Param("tutorId") tutorId: string) {
        try {
            const response = await this.tutorService.updatetutor(tutorId, body);
            return response;
        } catch (error) {
            errorMessageHandle(error, "updateTutor");
        }
    }

    @Put("/archive-tutor")
    async archiveTutor(@Body() body: any) {
        try {
            const response = await this.tutorService.archivetutor(body);
            return response;
        } catch (error) {
            errorMessageHandle(error, "updateTutor");
        }
    }

    @Get("/get-single-tutor/:tutorId")
    async getSingleStudent(@Param("tutorId") tutorId: string) {
        try {
            const response = await this.tutorService.getsingletutor(tutorId);
            return response;
        } catch (error) {
            errorMessageHandle(error, "updateTutor");
        }
    }
}
