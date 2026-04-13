export const HOME_HIGHLIGHT_CONFIG = [
  { label: "可入席人物", value: (skillCount: number) => `${skillCount || 0} 位` },
  { label: "思维门类", value: (skillCount: number, categoryCount: number) => `${categoryCount || 0} 组` },
  { label: "对谈节奏", value: () => "多轮续席" },
];

export const HOME_PROCESS_STEPS = [
  { title: "定题", description: "写下一问，或先从序页示例起笔。" },
  { title: "选席", description: "按门类挑几位人物，同席交锋，不必一次选满。" },
  { title: "收束", description: "每轮可插话，最后由主持整理共识、分歧与行动。" },
];
