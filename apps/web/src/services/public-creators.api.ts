import { apiClient } from "@/services/api-client";

export type PublicCreatorProfile = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  expertise: string[];
  isVerified: boolean;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  courses: Array<{
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    isFree: boolean;
    price: number | null;
    currency: string;
    moduleCount: number;
    enrollmentCount: number;
    category: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }>;
};

export async function getPublicCreator(username: string) {
  const response = await apiClient<PublicCreatorProfile>(`/public/creators/${username}`);
  return response.data;
}
