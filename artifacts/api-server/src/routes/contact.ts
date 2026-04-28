import { Router, type IRouter } from "express";
import { db, contactMessagesTable } from "@workspace/db";
import { SendContactMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = SendContactMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.insert(contactMessagesTable).values({
    name: parsed.data.name.trim(),
    email: parsed.data.email.toLowerCase().trim(),
    phone: parsed.data.phone?.trim() || null,
    message: parsed.data.message.trim(),
  });

  req.log.info({ email: parsed.data.email }, "Contact message received");
  res
    .status(201)
    .json({ message: "Thanks — we received your message and will be in touch shortly." });
});

export default router;
