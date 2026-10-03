import { BadRequestException } from '@nestjs/common';
export function object(value: unknown): Record<string, unknown> {
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('Expected an object');
 return value as Record<string, unknown>;
}
export function text(value: unknown, name: string, min = 1, max = 100): string {
 if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw new BadRequestException(`Invalid ${name} (${min}–${max} characters)`);
 return value.trim();
}
export function uuid(value: unknown): string {
 const id = text(value, 'id', 36, 36);
 if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new BadRequestException('Invalid id');
 return id;
}
export function choice(value: unknown, values: string[]): string {
 if (typeof value !== 'string' || !values.includes(value)) throw new BadRequestException('Invalid option');
 return value;
}
export function bool(value: unknown): boolean {
 if (typeof value !== 'boolean') throw new BadRequestException('Expected boolean');
 return value;
}
export function email(value: unknown): string {
 const result = text(value, 'email', 3, 254).toLowerCase();
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new BadRequestException('Invalid email');
 return result;
}
export function slug(value: unknown): string {
 const result = text(value, 'slug', 1, 160);
 if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) throw new BadRequestException('Invalid slug');
 return result;
}
