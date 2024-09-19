import { IsString, IsIn, IsDateString, IsNumber, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class Paypal {
    @IsNumber()
    amount: number;

    @IsNumber()
    fee: number;

    @IsNumber()
    total: number;
}

class Stripe {
    @IsNumber()
    amount: number;

    @IsNumber()
    fee: number;

    @IsNumber()
    total: number;
}

class Profit {
    @IsNumber()
    oneWeek: number;

    @IsNumber()
    fourWeeks: number;
}

class Payment {
    @ValidateNested()
    @Type(() => Paypal)
    paypal: Paypal;

    @ValidateNested()
    @Type(() => Stripe)
    stripe: Stripe;
}

export class StudentDTO {
    @IsString()
    studentId: string;

    @IsString()
    time: string;

    @IsDateString()
    startDate: Date;

    @IsString()
    zoomLink: string;

    @IsNumber()
    perWeek: number;

    @IsIn(["Active", "Inactive"])
    studentStatus: string;

    @IsDateString()
    dischargeDate: Date;

    @IsString()
    referralSource: string;

    @ValidateNested()
    @Type(() => Payment)
    payment: Payment;

    @IsNumber()
    tutorPayout: number;

    @ValidateNested()
    @Type(() => Profit)
    profit: Profit;
}
