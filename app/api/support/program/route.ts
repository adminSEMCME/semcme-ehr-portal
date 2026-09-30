import { sendSupportRequest } from "@/lib/sendSupportRequest";

export async function POST(request: Request) {
  return sendSupportRequest(request, "program");
}
