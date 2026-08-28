// Executa `task` para cada item de `items`, no maximo `limit` em paralelo.
// Usado para acelerar sincronizacoes com muitos upserts individuais
// (o gargalo e' a latencia de rede por chamada ao banco, nao a query em si).
export async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>
): Promise<void> {
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const current = index++;
      await task(items[current]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
}
