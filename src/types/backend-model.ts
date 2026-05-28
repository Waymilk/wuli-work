export type ModelOptionPrimitive = string | number | boolean
export type ModelOptionRange = [number, number] | { min?: number; max?: number }
export type ModelOptionValue =
  | ModelOptionPrimitive
  | ModelOptionPrimitive[]
  | ModelOptionRange
  | Record<string, unknown>
  | null
  | undefined

export interface BackendModelOptions {
  aspect_ratio?: ModelOptionValue
  aspect_ratios?: ModelOptionValue
  ratios?: ModelOptionValue
  resolutions?: ModelOptionValue
  num_images?: ModelOptionValue
  durations?: ModelOptionValue
  image_size?: ModelOptionValue
  image_sizes?: ModelOptionValue
  cost_per_generation?: ModelOptionValue
  costPerGeneration?: ModelOptionValue
}

export interface BackendModelConfig extends BackendModelOptions {
  icon?: string
  task_type?: string
  runway_model?: string
  cost_per_generation?: number | string | null
  costPerGeneration?: number | string | null
  description?: string
  display_name?: string
  tags?: string[] | string | null
  predictTypes?: string[]
  predict_types?: string[]
  options?: BackendModelOptions
}

export interface BackendModelRecord {
  id?: number
  name?: string
  provider?: string
  cost_per_generation?: number | string | null
  costPerGeneration?: number | string | null
  is_active?: boolean
  config?: BackendModelConfig | string | null
}
