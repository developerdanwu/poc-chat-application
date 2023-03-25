declare global {
  // missing type in openai module
  declare module "openai" {
    interface Model {
      permission: {
        allow_create_engine: boolean;
        allow_fine_tuning: boolean;
        allow_logprobs: boolean;
        allow_sampling: boolean;
        allow_search_indices: boolean;
        allow_view: boolean;
        created: Date;
        group: string | null;
        id: string;
        is_blocking: boolean;
        object: string;
        organization: string;
      }[];
    }
  }
}
