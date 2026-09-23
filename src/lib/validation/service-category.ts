import { z } from "zod"

export const serviceCategorySchema = z
  .object({
    name: z.string().min(1, "Enter a category name"),
    description: z.string().optional(),
    suggestedMinPrice: z.number().optional(),
    suggestedMaxPrice: z.number().optional(),
    isActive: z.boolean(),
  })
  .refine(
    (data) => data.suggestedMinPrice === undefined || data.suggestedMaxPrice === undefined || data.suggestedMinPrice <= data.suggestedMaxPrice,
    { message: "Min price must be less than or equal to max price", path: ["suggestedMaxPrice"] }
  )

export type ServiceCategoryValues = z.infer<typeof serviceCategorySchema>

export const serviceCategoryDefaultValues: ServiceCategoryValues = {
  name: "",
  description: "",
  suggestedMinPrice: undefined,
  suggestedMaxPrice: undefined,
  isActive: true,
}
