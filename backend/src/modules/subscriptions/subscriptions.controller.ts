import { Body, Controller, Get, Header, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OriginGuard } from '../../common/guards/origin.guard';
import { SessionGuard, type AuthenticatedRequest } from '../auth/guards/session.guard';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
@UseGuards(OriginGuard,SessionGuard)
export class SubscriptionsController {
 constructor(private readonly service:SubscriptionsService) {}
 @Get() @Header('Cache-Control','no-store')
 status(@Req() req:AuthenticatedRequest){return this.service.status(req.user.id);}
 @Post('checkout') checkout(@Req() req:AuthenticatedRequest){return this.service.checkout(req.user.id);}
 @Post('free-listings') choose(@Req() req:AuthenticatedRequest,@Body() body:unknown){return this.service.chooseFreeListings(req.user.id,body);}
 @Get('products/:id') @Header('Cache-Control','no-store')
 product(@Req() req:AuthenticatedRequest,@Param('id') id:string){return this.service.productPreview(req.user.id,id);}
 @Post('products/:id/checkout')
 productCheckout(@Req() req:AuthenticatedRequest,@Param('id') id:string){return this.service.productCheckout(req.user.id,id);}
}
