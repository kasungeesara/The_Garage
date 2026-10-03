import { PartDetail } from "@/features/marketplace/part-detail";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PartDetail slug={slug} />;
}
