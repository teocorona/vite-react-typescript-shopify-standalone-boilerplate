import express from "express";
import ViteExpress from "vite-express";
import { shopifyApi, ApiVersion, DeliveryMethod } from '@shopify/shopify-api';
import { orderUpdateHandler, uninstallHandler } from './webhooks';
import '@shopify/shopify-api/adapters/node';
import dotenv from 'dotenv';
dotenv.config();

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY ?? '',
  apiSecretKey: process.env.SHOPIFY_API_SECRET_KEY ?? '',
  scopes: process.env.SHOPIFY_SCOPES?.split(',') ?? [],
  hostName: process.env.SHOPIFY_APP_URL?.replace(/https:\/\//, "") ?? '',
  apiVersion: process.env.SHOPIFY_API_VERSION as ApiVersion ?? ApiVersion.January24,
  isEmbeddedApp: false,
  logger: { level: 3 },
});

shopify.webhooks.addHandlers({
  APP_UNINSTALLED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/webhooks",
    callback: uninstallHandler,
  },
  ORDERS_UPDATED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/webhooks",
    callback: orderUpdateHandler,
  },
});

const app = express();

app.get('/auth', async (req, res) => {
  console.log('/auth')
  //TODO: implementar middleware
  // console.log(req.query)
  const shop: string = req.query.shop as string;
  if (!shop) return res.status(400).send('Missing shop parameter');
  console.log(shop)
  await shopify.auth.begin({
    shop: shopify.utils.sanitizeShop(shop, true) ?? '',
    callbackPath: '/auth/callback',
    isOnline: true,
    rawRequest: req,
    rawResponse: res,
  });
});

app.get('/auth/callback', async (req, res) => {
  const callback = await shopify.auth.callback({
    rawRequest: req,
    rawResponse: res,
  });
  //TODO: save session

  // Register webhooks
  const webhooks = await shopify.webhooks.register({
    session: callback.session,
  });
  Object.keys(webhooks).forEach((webhook) => {
    if (webhooks[webhook]?.[0]?.success === true) {
      console.log(`Registered ${webhook} webhook`);
    } else {
      console.log(
        `Failed to register ${webhook} webhook: ${webhooks.result}`
      );
    }
  });
  // Get orders
  const client = new shopify.clients.Rest({ session: callback.session });
  const { body } = await client.get({ path: 'orders' })
  // console.dir(body, { depth: null });
  body.orders.forEach((order: any) => {
    console.log(order.name);
  })
  //TODO: save orders
  console.log(req.query)
  res.redirect('/shopify');
});

app.post('/webhooks', express.text({ type: '*/*' }), async (req, res) => {
  try {
    await shopify.webhooks.process({
      rawBody: req.body, // is a string
      rawRequest: req,
      rawResponse: res,
    });
  } catch (error: any) {
    console.log(error.message);
  }
});

app.get("/shopify", (req, res) => {
  res.send("APP");
});



ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);

