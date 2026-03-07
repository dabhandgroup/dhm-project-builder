"use server";

import type { ProjectFormData } from "@/types/project";

export async function createProject(_data: ProjectFormData) {
  // Mock: no-op for UI design mode
  return { id: "new-project" };
}

export async function saveDraft(_data: ProjectFormData, _projectId?: string) {
  // Mock: no-op for UI design mode
  return { id: _projectId ?? "draft-project" };
}

export async function updateProject(_projectId: string, _data: ProjectFormData) {
  // Mock: no-op for UI design mode
  return { success: true };
}

export async function updateProjectStatus(_projectId: string, _status: string) {
  // Mock: no-op for UI design mode
  return { success: true };
}

export async function deleteProject(_projectId: string) {
  // Mock: no-op for UI design mode
  return { success: true };
}
