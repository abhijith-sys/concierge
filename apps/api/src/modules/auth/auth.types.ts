export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
} as const;

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "user" | "business" | "admin";
  createdAt: Date;
};
