# Busca Funcional em Produtos e Adicionais

## Goal
Fazer o campo de busca em Produtos e Adicionais funcionar com filtro client-side em tempo real, adicionando um ícone de lupa (🔍) à direita do input em ambos.

## Context
- **Produtos:** `src/app/(dashboard)/produtos/produtos-client.tsx` linha 159 — `<Input placeholder="Buscar produtos..." className="max-w-sm" />` existe mas **não está conectado a nenhum state**, não filtra nada. Os produtos são renderizados diretamente de `initialProducts` sem filtro.
- **Adicionais:** `src/app/(dashboard)/produtos/adicionais-client.tsx` linha 175 — `<Input placeholder="Buscar adicionais..." className="max-w-sm" />` mesmo problema, campo decorativo.
- **Componente Input:** `@/components/ui/input` — input padrão shadcn/ui.
- **Ícone:** Usar `Search` do `lucide-react` (já instalado no projeto).

## Tasks
- [ ] **Produtos — conectar busca:** Em `produtos-client.tsx`:
  - Criar state `const [searchQuery, setSearchQuery] = useState('')`.
  - Conectar o Input: `value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}`.
  - Filtrar `initialProducts` com: `initialProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase()))`.
  - Usar o array filtrado no `.map()` da renderização (linha 475).
  - Adicionar ícone `<Search>` à direita do Input (usar wrapper `relative` + posicionamento absoluto).
- [ ] **Adicionais — conectar busca:** Em `adicionais-client.tsx`:
  - Mesmo pattern: state `searchQuery`, conectar ao Input, filtrar `addons` por `name` e `description`.
  - Usar array filtrado no `.map()` (linha 340).
  - Adicionar ícone `<Search>` à direita.
- [ ] **Estilizar ícone de busca:** Ambos devem ter a lupa posicionada à direita dentro do Input:
  ```tsx
  <div className="relative max-w-sm">
    <Input ... className="pr-10" />
    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  </div>
  ```
- [ ] **Estado vazio:** Se a busca não retornar resultados, exibir "Nenhum resultado para '[query]'" ao invés de "Nenhum produto/adicional cadastrado".

## Done When
- [ ] Digitar no campo de busca de Produtos filtra os cards em tempo real por nome ou descrição
- [ ] Digitar no campo de busca de Adicionais filtra os cards em tempo real por nome ou descrição
- [ ] Ícone de lupa aparece à direita em ambos os inputs
- [ ] Estado vazio mostra mensagem específica quando busca não tem resultados
- [ ] Limpar o campo mostra todos os itens novamente

## Notes
- Filtro é client-side (já temos todos os dados via `initialProducts` / `addons`)
- Import adicional necessário: `Search` de `lucide-react` (já usado em outros arquivos do projeto)
- Não precisa debounce — a lista nunca será grande o suficiente para causar problemas de performance
