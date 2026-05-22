# Busca Funcional em Categorias

## Goal
Fazer o campo de busca de Categorias funcionar com filtro client-side em tempo real e adicionar ícone de lupa à direita.

## Context
- **Categorias:** `src/app/(dashboard)/categorias/categorias-client.tsx` linha 79 — `<Input placeholder="Buscar categorias..." className="max-w-sm" />` existe mas **não filtra nada**. As categorias são renderizadas diretamente de `initialCategories` sem filtro.
- **Layout:** Categorias são renderizadas numa lista com `divide-y` dentro de um Card, não em grid de cards como produtos.

## Tasks
- [ ] **Conectar busca:** Em `categorias-client.tsx`:
  - Criar state `const [searchQuery, setSearchQuery] = useState('')`.
  - Conectar o Input existente (linha 79).
  - Filtrar `initialCategories` por `name` (case-insensitive) e opcionalmente por `type`.
  - Usar array filtrado no `.map()` (linha 151).
- [ ] **Adicionar ícone de lupa:** Mesma técnica das tasks 08 — wrapper `relative`, Input com `pr-10`, `<Search>` posicionado à direita.
  ```tsx
  <div className="relative max-w-sm">
    <Input value={searchQuery} onChange={...} placeholder="Buscar categorias..." className="pr-10" />
    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  </div>
  ```
- [ ] **Estado vazio:** Quando busca não retorna resultados, exibir "Nenhuma categoria encontrada para '[query]'" ao invés do genérico.

## Done When
- [ ] Digitar no campo de busca filtra categorias em tempo real por nome
- [ ] Ícone de lupa aparece à direita do Input
- [ ] Busca sem resultados mostra mensagem específica
- [ ] Limpar o campo mostra todas as categorias

## Notes
- Mesmo pattern da task 08, mas aplicado a `categorias-client.tsx`
- Import necessário: `Search` de `lucide-react`
- Filtro client-side — dados já estão em `initialCategories`
