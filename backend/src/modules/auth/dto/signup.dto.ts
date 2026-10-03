import { Transform } from 'class-transformer';
import { IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { LoginDto } from './login.dto';

export class SignupDto extends LoginDto {
  @MinLength(8)
  @MaxLength(128)
  declare password: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(2, 100)
  name!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(7, 25)
  @Matches(/^\+?[0-9 ()-]+$/, { message: 'phone must be a valid phone number' })
  phone!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(2, 100)
  city!: string;
}
