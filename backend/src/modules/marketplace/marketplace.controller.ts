import { BadRequestException, Body, Controller, Get, Header, NotFoundException, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { Throttle } from '@nestjs/throttler';
import { DatabaseService } from '../../database/database.service';
import { SessionRepository } from '../auth/session.repository';
import { SESSION_COOKIE, SessionGuard, type AuthenticatedRequest } from '../auth/guards/session.guard';
import { OriginGuard } from '../../common/guards/origin.guard';
import { MarketplaceService } from './marketplace.service';
import { email, object, text, uuid } from './validation';

@Controller()
@UseGuards(OriginGuard)
export class MarketplaceController {
 constructor(private readonly service:MarketplaceService,private readonly sessions:SessionRepository,private readonly db:DatabaseService) {}
 @Get('state') @Header('Cache-Control','no-store')
 async state(@Req() req:Request) { return this.service.state(await this.sessions.findUser(req.cookies?.[SESSION_COOKIE])); }
 @Post('commands') @UseGuards(SessionGuard)
 async command(@Req() req:AuthenticatedRequest,@Body() body:unknown) { return this.service.command(req.user,body); }
 @Post('contact') @Throttle({default:{limit:5,ttl:60000}})
 async contact(@Body() body:unknown) {
  const d=object(body);const id=randomUUID();
  await this.db.pool.query('INSERT INTO contacts(id,name,email,topic,message) VALUES($1,$2,$3,$4,$5)',[id,text(d.name,'name',2),email(d.email),text(d.topic,'topic',2,200),text(d.message,'message',10,5000)]);
  return {id};
 }
 @Post('listings/:id/view') @Throttle({default:{limit:120,ttl:60000}})
 async view(@Param('id') id:string,@Req() req:Request) {
  const viewer=createHash('sha256').update(`${process.env.VIEW_HASH_SECRET}:${req.ip}:${new Date().toISOString().slice(0,10)}`).digest('hex');
  await this.db.pool.query(`INSERT INTO listing_views(listing_id,viewer_hash) SELECT l.id,$2 FROM listings l JOIN users u ON u.id=l.owner_id WHERE l.id=$1 AND l.status IN ('Published','Sold') AND l.deleted_at IS NULL AND u.status='Active' ON CONFLICT DO NOTHING`,[uuid(id),viewer]);
  const user=await this.sessions.findUser(req.cookies?.[SESSION_COOKIE]);
  if(user) await this.db.pool.query(`INSERT INTO recent_views(user_id,listing_id,viewed_at) SELECT $1,l.id,now() FROM listings l JOIN users u ON u.id=l.owner_id WHERE l.id=$2 AND l.status IN ('Published','Sold') AND l.deleted_at IS NULL AND u.status='Active' ON CONFLICT(user_id,listing_id) DO UPDATE SET viewed_at=now()`,[user.id,uuid(id)]);
  return {ok:true};
 }
 @Post('media') @UseGuards(SessionGuard) @Throttle({default:{limit:20,ttl:60000}})
 async upload(@Req() req:AuthenticatedRequest,@Body() body:unknown) {
  const d=object(body),data=text(d.image,'image',1,7100000);
  const match=data.match(/^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  if(!match) throw new BadRequestException('Upload JPG, PNG or WebP photos');
  const bytes=Buffer.from(match[1],'base64'); if(bytes.length>5*1024*1024) throw new BadRequestException('Maximum photo size is 5 MB');
  let clean:Buffer;
  try { const source=sharp(bytes,{limitInputPixels:25000000,animated:false});const metadata=await source.metadata();if(!['jpeg','png','webp'].includes(metadata.format??''))throw new Error('Unsupported format');clean=await source.rotate().resize(1600,1600,{fit:'inside',withoutEnlargement:true}).jpeg({quality:82}).toBuffer(); }
  catch { throw new BadRequestException('Invalid or oversized image'); }
  const c=await this.db.pool.connect();
  try {
   await c.query('BEGIN');
   const active=await c.query("SELECT id FROM users WHERE id=$1 AND status='Active' FOR UPDATE",[req.user.id]);if(!active.rowCount)throw new BadRequestException('Account unavailable');
   const used=await c.query('SELECT count(*)::int AS count FROM media WHERE owner_id=$1',[req.user.id]);if(used.rows[0].count>=500)throw new BadRequestException('Photo quota reached. Contact support.');
   const id=randomUUID();await c.query('INSERT INTO media(id,owner_id,content) VALUES($1,$2,$3)',[id,req.user.id,clean]);await c.query('COMMIT');return {url:`/api/media/${id}`};
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
 }
 @Get('media/:id')
 async media(@Param('id') id:string,@Req() req:Request,@Res() res:Response) {
  const user=await this.sessions.findUser(req.cookies?.[SESSION_COOKIE]);
  const row=(await this.db.pool.query(`SELECT m.content FROM media m WHERE m.id=$1 AND (m.owner_id=$2 OR $3 OR EXISTS(SELECT 1 FROM listings l JOIN users u ON u.id=l.owner_id WHERE l.status IN ('Published','Sold') AND l.deleted_at IS NULL AND u.status='Active' AND l.data->'images' ? $4))`,[uuid(id),user?.id??null,user?.role==='Admin',`/api/media/${id}`])).rows[0];
  if(!row) throw new NotFoundException('Photo not found');res.set({'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}).send(row.content);
 }
 @Get('health') async health() { await this.db.pool.query('SELECT 1');return {status:'ok'}; }
}
