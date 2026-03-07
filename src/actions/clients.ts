"use server";

export async function createClient(_data: { name: string; email?: string; phone?: string; company?: string; address?: string }) {
  // Mock: no-op for UI design mode
  return { id: "new-client" };
}

export async function updateClient(_id: string, _data: { name?: string; email?: string; phone?: string; company?: string; address?: string }) {
  // Mock: no-op for UI design mode
  return { success: true };
}

export async function deleteClient(_id: string) {
  // Mock: no-op for UI design mode
  return { success: true };
}
