import { errorMessageHandle } from "helpers/common/error-handle";
import { FinanceService } from "service/finance.service";
import { Body, Controller, Post } from "@nestjs/common";

@Controller("finance")
export default class FinanceController {
    constructor(private readonly financeService: FinanceService) {}

    @Post("/get-data")
    async dashboarddata(@Body() body: any) {
        try {
            const response = await this.financeService.financeFilterService(body);
            return response;
        } catch (error) {
            errorMessageHandle(error, "dashboarddata");
        }
    }
}
