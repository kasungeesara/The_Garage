import { ListingFormPage } from "@/features/seller/listing-form";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListingFormPage id={id} />;
}
