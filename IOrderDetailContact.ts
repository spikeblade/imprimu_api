import { z } from 'zod'

export const OrderDetailContactScheme = z.object({
  id: z.number().optional(),
  contact_id: z.number(),
  order_detail_id: z.number(),
  contact_type: z.number().optional()
})

export type OrderDetailContact = z.infer<typeof OrderDetailContactScheme>
