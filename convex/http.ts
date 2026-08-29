import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
	path: "/stripe-webhook",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const signature = request.headers.get("stripe-signature");
		if (!signature) {
			return new Response("Missing stripe-signature", { status: 400 });
		}
		const body = await request.text();
		await ctx.runAction(internal.stripe.handleWebhook, { body, signature });
		return new Response("ok", { status: 200 });
	})
});

http.route({
	path: "/health",
	method: "GET",
	handler: httpAction(async () => {
		return new Response("stagr-ok", { status: 200 });
	})
});

export default http;
