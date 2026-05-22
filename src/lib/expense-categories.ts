export const EXPENSE_CATEGORIES = [
  { value: 'assinaturas', label: 'Assinaturas' },
  { value: 'alimentos', label: 'Alimentos / Insumos' },
  { value: 'energia', label: 'Energia Elétrica' },
  { value: 'agua', label: 'Água' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'motoboys', label: 'Motoboys / Entregadores' },
  { value: 'salarios', label: 'Salários' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'marketing', label: 'Marketing / Publicidade' },
  { value: 'embalagens', label: 'Embalagens' },
  { value: 'outros', label: 'Outros' },
] as const;

export type ExpenseCategoryValue = typeof EXPENSE_CATEGORIES[number]['value'];

export const getCategoryLabel = (value: string): string => {
  const found = EXPENSE_CATEGORIES.find(c => c.value === value);
  return found?.label || value;
};
