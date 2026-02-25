export interface Role {
  id: string;
  title: string;
  description?: string;
}

export const ROLES: Role[] = [
  { id: 'e86180c3-156b-43eb-9ffa-f042f3e4c975', title: 'Marketing Head' },
  { id: '4e83b8c3-f3f4-41dd-9a3e-a0fa17f806ed', title: 'Operations Head' },
  { id: 'fb37d93f-c2d6-4d4b-88a0-a4d8fee9fadd', title: 'Product Manager' },
  { id: '48549e81-c699-4b7b-aa7a-4f64b4555f37', title: 'Content Strategist' },
  { id: 'ccd0eafe-6d17-4b8b-ae9a-b6e09642f2d7', title: 'Strategy Advisor' },
];
