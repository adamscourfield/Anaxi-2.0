import { redirect } from "next/navigation";

export default function TenantCompatPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const { slug } = params;

  if (!slug || slug.length === 0) {
    redirect("/home");
  }

  const destination = `/${slug.join("/")}`;
  redirect(destination);
}
