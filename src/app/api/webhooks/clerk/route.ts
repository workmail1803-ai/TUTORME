import { headers } from "next/headers";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

type ClerkEmail = { id: string; email_address: string };
type ClerkUserData = {
  id: string;
  email_addresses: ClerkEmail[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
};
type ClerkEvent =
  | { type: "user.created" | "user.updated"; data: ClerkUserData }
  | { type: "user.deleted"; data: { id: string } };

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const h = await headers();
  const svixId = h.get("svix-id");
  const svixTimestamp = h.get("svix-timestamp");
  const svixSignature = h.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();
  let event: ClerkEvent;
  try {
    event = new Webhook(secret).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const d = event.data;
      const email =
        d.email_addresses.find((e) => e.id === d.primary_email_address_id)
          ?.email_address ??
        d.email_addresses[0]?.email_address ??
        `${d.id}@no-email.local`;

      await prisma.user.upsert({
        where: { clerkId: d.id },
        create: {
          clerkId: d.id,
          email,
          firstName: d.first_name,
          lastName: d.last_name,
          imageUrl: d.image_url,
        },
        update: {
          email,
          firstName: d.first_name,
          lastName: d.last_name,
          imageUrl: d.image_url,
        },
      });
      break;
    }
    case "user.deleted": {
      await prisma.user
        .delete({ where: { clerkId: event.data.id } })
        .catch(() => undefined); // already gone — ignore
      break;
    }
  }

  return new Response("ok", { status: 200 });
}
