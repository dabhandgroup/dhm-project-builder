export interface AIModel {
  value: string;
  label: string;
  description: string;
}

export const aiModels: AIModel[] = [
  {
    value: "orchids",
    label: "Orchids App",
    description: "AI website builder with templates and deployment",
  },
  {
    value: "claude",
    label: "Claude",
    description: "Anthropic's AI for custom website generation",
  },
  {
    value: "grok",
    label: "Grok",
    description: "Fast inference for website generation",
  },
];
