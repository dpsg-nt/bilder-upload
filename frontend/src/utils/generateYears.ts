export {};

export const generateYears = (): number[] => {
  const years: number[] = [];
  for (let i = 1950; i <= new Date().getFullYear(); i++) {
    years.push(i);
  }
  return years;
};
