"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ProfileBasicInfo,
  ProfileExperience,
  ProfileProject,
  ProfileSkill,
  ProfileSkillCategory,
} from "@/types/local-features";

type ProfileBuilderState = {
  basicInfo: ProfileBasicInfo;
  skills: ProfileSkill[];
  projects: ProfileProject[];
  experiences: ProfileExperience[];
  updateBasicInfo: (payload: Partial<ProfileBasicInfo>) => void;
  updateLinks: (payload: Partial<ProfileBasicInfo["links"]>) => void;
  addSkill: (name: string, category: ProfileSkillCategory) => void;
  removeSkill: (id: string) => void;
  addProject: (project: Omit<ProfileProject, "id">) => void;
  updateProject: (id: string, payload: Omit<ProfileProject, "id">) => void;
  removeProject: (id: string) => void;
  addExperience: (experience: Omit<ProfileExperience, "id">) => void;
  updateExperience: (id: string, payload: Omit<ProfileExperience, "id">) => void;
  removeExperience: (id: string) => void;
  resetAll: () => void;
};

const generateId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const defaultBasicInfo: ProfileBasicInfo = {
  fullName: "",
  username: "",
  university: "",
  graduationYear: "",
  location: "",
  headline: "",
  bio: "",
  links: {
    website: "",
    github: "",
    linkedin: "",
    portfolio: "",
  },
};

export const useProfileBuilderStore = create<ProfileBuilderState>()(
  persist(
    (set) => ({
      basicInfo: defaultBasicInfo,
      skills: [],
      projects: [],
      experiences: [],
      updateBasicInfo: (payload) =>
        set((state) => ({
          basicInfo: { ...state.basicInfo, ...payload },
        })),
      updateLinks: (payload) =>
        set((state) => ({
          basicInfo: {
            ...state.basicInfo,
            links: { ...state.basicInfo.links, ...payload },
          },
        })),
      addSkill: (name, category) =>
        set((state) => ({
          skills: [...state.skills, { id: generateId(), name: name.trim(), category }],
        })),
      removeSkill: (id) =>
        set((state) => ({
          skills: state.skills.filter((skill) => skill.id !== id),
        })),
      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, { ...project, id: generateId() }],
        })),
      updateProject: (id, payload) =>
        set((state) => ({
          projects: state.projects.map((project) => (project.id === id ? { ...payload, id } : project)),
        })),
      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
        })),
      addExperience: (experience) =>
        set((state) => ({
          experiences: [...state.experiences, { ...experience, id: generateId() }],
        })),
      updateExperience: (id, payload) =>
        set((state) => ({
          experiences: state.experiences.map((experience) =>
            experience.id === id ? { ...payload, id } : experience
          ),
        })),
      removeExperience: (id) =>
        set((state) => ({
          experiences: state.experiences.filter((experience) => experience.id !== id),
        })),
      resetAll: () =>
        set({
          basicInfo: defaultBasicInfo,
          skills: [],
          projects: [],
          experiences: [],
        }),
    }),
    {
      name: "interniq-profile-builder-v1",
      version: 1,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<ProfileBuilderState>;
        return {
          basicInfo: {
            ...defaultBasicInfo,
            ...(state.basicInfo ?? {}),
            links: {
              ...defaultBasicInfo.links,
              ...state.basicInfo?.links,
            },
          },
          skills: Array.isArray(state.skills) ? state.skills : [],
          projects: Array.isArray(state.projects) ? state.projects : [],
          experiences: Array.isArray(state.experiences) ? state.experiences : [],
        } as ProfileBuilderState;
      },
      partialize: (state) => ({
        basicInfo: state.basicInfo,
        skills: state.skills,
        projects: state.projects,
        experiences: state.experiences,
      }),
    }
  )
);
