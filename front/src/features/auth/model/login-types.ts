export type LoginField = "login_id" | "password";

export type LoginPayload = {
  login_id: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: {
    id: string | number;
    login_id: string;
  };
};

export type AuthMeResponse = {
  user: {
    id: string | number;
    login_id: string;
  };
  profile: {
    nickname: string;
    profile_image_url?: string | null;
  };
};
