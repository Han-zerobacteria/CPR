export function createQueryClient() {
  return {
    defaultOptions: {
      queries: {
        staleTime: 1000 * 30,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  };
}
