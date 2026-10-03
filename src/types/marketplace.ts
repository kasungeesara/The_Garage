export type ListingStatus =
  | "Published"
  | "Pending"
  | "Draft"
  | "Paused"
  | "Sold"
  | "Archived"
  | "Rejected";
export type Part = {
  id: string;
  slug: string;
  title: string;
  category: string;
  brand: string;
  model: string;
  year: string;
  fuel: string;
  transmission: string;
  price: number;
  condition: string;
  city: string;
  seller: string;
  status: ListingStatus;
  featured: boolean;
  views: number;
  description: string;
  images?: string[];
};
export type Article = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  status: string;
  featured: boolean;
  date: string;
};
export type Enquiry = {
  buyerId?: string;
  sellerId?: string;
  id: string;
  partId: string;
  subject: string;
  status: string;
  messages: { text: string; from: string; time: string }[];
};
export type Review = {
  authorId?: string;
  id: string;
  seller: string;
  name: string;
  rating: number;
  text: string;
  reply: string;
};
export const money = (value: number) =>
  `Rs. ${new Intl.NumberFormat("en-LK").format(value)}`;
