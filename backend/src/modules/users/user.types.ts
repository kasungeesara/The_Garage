export interface PublicUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  city: string;
  createdAt: Date;
  role: "Customer" | "Seller" | "Admin";
  status: "Active" | "Suspended";
  emailVerified: boolean;
}
export interface UserRecord extends PublicUser { passwordHash: string }
export function publicUser(user: UserRecord): PublicUser {
  return { id: user.id, email: user.email, name: user.name, phone: user.phone, city: user.city, createdAt: user.createdAt, role: user.role, status: user.status, emailVerified: user.emailVerified };
}
