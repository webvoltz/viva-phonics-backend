import { MessageTemplateDTO, MessageTypeDTO } from "../dto/messageTemplate/messageTemplate.dto";
import { Controller, Post, Put, Get, Delete, Param, Body, Req } from "@nestjs/common";
import { MessageTemplatesService } from "../service/messageTemplates.service";
import logger from "utils/logger";

@Controller("message-templates")
export class MessageTemplatesController {
    constructor(private readonly messageTemplatesService: MessageTemplatesService) {}

    /**
     * Add message template
     * @param req
     * @param messageTemplateDTO
     * @returns
     */
    @Post("add")
    async messageTemplatesInsert(@Req() req: any, @Body() messageTemplateDTO: MessageTemplateDTO) {
        try {
            messageTemplateDTO.updatedBy = req.userId;
            messageTemplateDTO.createdBy = req.userId;

            return await this.messageTemplatesService.messageTemplatesInsert(messageTemplateDTO);
        } catch (error) {
            logger?.error("messageTemplatesInsert - Error: ", error);
        }
    }

    /**
     * Update message template
     * @param req
     * @param messageTemplateDTO
     * @returns
     */
    @Put("update/:id")
    async messageTemplatesUpdate(@Req() req: any, @Body() messageTemplateDTO: MessageTemplateDTO, @Param() params: any) {
        try {
            messageTemplateDTO.updatedBy = req.userId;
            messageTemplateDTO.createdBy = req.userId;

            return await this.messageTemplatesService.messageTemplatesUpdate(params.id, messageTemplateDTO);
        } catch (error) {
            logger?.error("messageTemplatesUpdate - Error: ", error);
        }
    }

    /**
     * Delete message template
     * @param req
     * @param messageTemplateDTO
     * @returns
     */
    @Delete("delete/:id")
    async messageTemplatesDelete(@Param() params: any) {
        try {
            return await this.messageTemplatesService.messageTemplatesDelete(params.id);
        } catch (error) {
            logger?.error("messageTemplatesDelete - Error: ", error);
        }
    }

    /**
     * List message template
     * @param req
     * @param messageTemplateDTO
     * @returns
     */
    @Put("list")
    async messageTemplatesList(@Body() messageTypeDTO: MessageTypeDTO) {
        try {
            return await this.messageTemplatesService.messageTemplatesList(messageTypeDTO);
        } catch (error) {
            logger?.error("messageTemplatesList - Error: ", error);
        }
    }

    /**
     * get single message template
     * @param req
     * @param messageTemplateDTO
     * @returns
     */
    @Get("listOne/:id")
    async messageTemplatesListOne(@Param() params: any) {
        try {
            return await this.messageTemplatesService.messageTemplatesListOne(params.id);
        } catch (error) {
            logger?.error("messageTemplatesListOne - Error: ", error);
        }
    }
}
