import { redirect } from "next/navigation";

export default async function AdministrationIndexPage({
  params,
}: {
  params: Promise<{ lang: string; orgId: string }>;
}) {
  const { lang, orgId } = await params;
  redirect(`/${lang}/organizations/${orgId}/administration/branches`);
}
