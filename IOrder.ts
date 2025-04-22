import { z } from 'zod'
import { PodScheme } from './IPod'

export const OrderScheme = z.object({
  id: z.number().optional(),
  order_number: z.string().max(256),
  pods: z.array(PodScheme),
  reorder: z.boolean().optional().default(false),
  store_id: z.number().positive(),
  source_id: z.number().positive()
})

export const ReOrderScheme = z.object({
  id: z.number().positive()
})

export type Order = z.infer<typeof OrderScheme>
