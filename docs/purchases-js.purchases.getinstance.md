<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@revenuecat/purchases-js](./purchases-js.md) &gt; [Purchases](./purchases-js.purchases.md) &gt; [getInstance](./purchases-js.purchases.getinstance.md)

## Purchases.getInstance() method

Get the singleton instance of Purchases. It's preferred to use the instance obtained from the [Purchases.initializePurchases()](./purchases-js.purchases.initializepurchases.md) method when possible.

**Signature:**

```typescript
static getInstance(): Purchases;
```
**Returns:**

[Purchases](./purchases-js.purchases.md)

## Exceptions

[UninitializedPurchasesError](./purchases-js.uninitializedpurchaseserror.md) if the instance has not been initialized yet.
