import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseInterceptors, UploadedFiles } from "@nestjs/common";
import { errorMessageHandle } from "helpers/common/error-handle";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { S3FileUploadService } from "../helpers/fileHandler";
import { ChangePasswordDto } from "../dto/user/changePwdDto";
import { CustomRequest } from "interface/request.interface";
import { UpdateUserDto } from "../dto/user/updateUserDto";
import { ForgetPwdDto } from "../dto/user/forgetPwdDto";
import { ResetPwdDto } from "../dto/user/resetPwdDto";
import { UserLogin } from "../dto/user/userLoginDto";
import { AdminService } from "service/admin.service";
import { DeleteUser } from "../dto/user/deleteDto";
import { UserAdd } from "../dto/user/userAdd";
import logger from "utils/logger";

@Controller("user")
export default class UserController {
    constructor(
        private readonly adminService: AdminService,
        private readonly s3FileUploadService: S3FileUploadService,
    ) {}

    @Post("/add-user")
    async userAdd(@Body() body: UserAdd) {
        try {
            const response = await this.adminService.userAdd(body);
            return response;
        } catch (error) {
            errorMessageHandle(error, "userAdd");
        }
    }

    @Post("/login")
    async userLogin(@Body() body: UserLogin) {
        try {
            const response = await this.adminService.userLogin(body, false);
            return response;
        } catch (error) {
            errorMessageHandle(error, "userLogin");
        }
    }

    @Post("/logout")
    async userLogout(@Req() req: any) {
        try {
            return await this.adminService.userLogout(req.userId, req.token);
        } catch (error) {
            logger?.error("userLogout - Error: ", error);
        }
    }

    @Put("/change-password")
    async userChangePassword(@Req() req: any, @Body() body: ChangePasswordDto) {
        try {
            return await this.adminService.userChangePassword(body);
        } catch (error) {
            logger?.error("userChangePassword - Error: ", error);
        }
    }

    @Put("/update/:userId")
    @UseInterceptors(AnyFilesInterceptor())
    async userUpdate(@Param("userId") userId: string, @Body() body: UpdateUserDto) {
        try {
            const response = await this.adminService.userUpdate(userId, body);
            return response;
        } catch (error) {
            logger?.error("userUpdate - Error: ", error);
        }
    }

    @Delete("/delete")
    async userDelete(@Body() body: DeleteUser, @Req() req: CustomRequest) {
        try {
            body.updatedBy = req.userId;

            return await this.adminService.userDelete(body);
        } catch (error) {
            logger?.error("userDelete - Error: ", error);
        }
    }

    @Put("/forget-password")
    async userForgotPassword(@Body() body: ForgetPwdDto) {
        try {
            return await this.adminService.userForgotPassword(body);
        } catch (error) {
            logger?.error("userForgotPassword - Error: ", error);
        }
    }

    @Put("/reset-password")
    async userPasswordReset(@Body() body: ResetPwdDto) {
        try {
            return await this.adminService.userPasswordReset(body);
        } catch (error) {
            logger?.error("userPasswordReset - Error: ", error);
        }
    }

    @Get("key-verify/:key")
    async linkExpired(@Param("key") key: string) {
        try {
            return await this.adminService.linkExpired(key);
        } catch (error) {
            logger?.error("linkExpired - Error: ", error);
            errorMessageHandle(error, "linkExpired");
        }
    }

    @Post("import-csv")
    @UseInterceptors(AnyFilesInterceptor())
    async importCSV(@UploadedFiles() file: any[]) {
        try {
            return await this.adminService.importCSV(file);
        } catch (error) {
            logger?.error("importCSV - Error: ", error);
        }
    }
}
