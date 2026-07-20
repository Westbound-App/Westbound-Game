import { redirect } from "next/navigation";

/** Canonical public experience is home; keep /live as alias. */
export default function LiveAliasPage() {
  redirect("/");
}
