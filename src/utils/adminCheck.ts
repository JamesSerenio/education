// src/utils/adminCheck.ts
export const isAdminUser = (): boolean => {
  return localStorage.getItem("role") === "admin";
};
