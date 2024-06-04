

export const uninstallHandler = async (
  topic: any,
  shop: any,
  webhookRequestBody: any,
  webhookId: any,
  apiVersion: any,
) => {
  const webhookBody = JSON.parse(webhookRequestBody);
  console.log('uninstall WEBHOOOOOOOOOOOK', webhookBody)
};

export const orderUpdateHandler = async (
  topic: any,
  shop: any,
  webhookRequestBody: any,
  webhookId: any,
  apiVersion: any,
) => {
  const webhookBody = JSON.parse(webhookRequestBody);
  console.log('order update WEBHOOOOOOOOOOOK', webhookBody)
};
