import { startCheckout } from "@/lib/checkout";

export const dynamic = "force-dynamic";

export async function GET() {
  return startCheckout("premium_med");
}

export async function POST() {
  return startCheckout("premium_med");
}
