import { redirect } from "next/navigation";

export default async function AdministrationIndexPage({
  params,
}: {
  params: Promise<{ lang: string; orgId: string }>;
}) {
  const { lang, orgId } = await params;
  // Land on Organization; non-owners are bounced to Branches by that page's guard.
  redirect(`/${lang}/organizations/${orgId}/administration/organization`);
}
