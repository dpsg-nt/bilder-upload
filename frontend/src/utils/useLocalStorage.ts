import * as React from "react";

export const useLocalStorage = (key: string, initialValue: string) => {
  const [storedValue, setStoredValue] = React.useState(() => {
    const item = window.localStorage.getItem(key);
    return item ? item : initialValue;
  });
  const setValue = (value: string) => {
    setStoredValue(value);
    window.localStorage.setItem(key, value);
  };

  return [storedValue, setValue] as const;
};
