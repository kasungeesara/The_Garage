import { ConversationPage } from "@/features/account/enquiries";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ConversationPage id={id} />;
}
