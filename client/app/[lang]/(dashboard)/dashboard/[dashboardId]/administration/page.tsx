import { redirect } from "next/navigation";

export default async function AdministrationIndexPage({
  params,
}: {
  params: Promise<{ lang: string; dashboardId: string }>;
}) {
  const { lang, dashboardId } = await params;
  redirect(`/${lang}/dashboard/${dashboardId}/administration/branches`);
}
