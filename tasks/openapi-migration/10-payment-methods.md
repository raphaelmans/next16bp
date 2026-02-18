# Payment Methods (Owner)

## Endpoints (proposed)

- `GET /api/mobile/v1/owner/organizations/{organizationId}/payment-methods`
- `POST /api/mobile/v1/owner/organizations/{organizationId}/payment-methods`
- `PATCH /api/mobile/v1/owner/payment-methods/{paymentMethodId}`
- `DELETE /api/mobile/v1/owner/payment-methods/{paymentMethodId}`
- `POST /api/mobile/v1/owner/payment-methods/{paymentMethodId}/set-default`

Maps to (tRPC)

- `organizationPayment.listMethods`
- `organizationPayment.createMethod`
- `organizationPayment.updateMethod`
- `organizationPayment.deleteMethod`
- `organizationPayment.setDefault`
