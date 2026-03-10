import { Body, Controller, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@Controller('products')
export class ProductsController {
    constructor(private readonly prodctsService: ProductsService) {};

    @Post()
    async create(
        @Session() session: UserSession,
    ) {

    }
}

