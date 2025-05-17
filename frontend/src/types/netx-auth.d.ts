import "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: {
      userId: string;
      name?: string;
      email?: string;
      profilePicture?: string;
      image?: string; // Compatible con el campo estándar de NextAuth
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    user: {
      userId: string;
      name?: string;
      email?: string;
      profilePicture?: string;
    }
    userImage?: string; // Para almacenar la imagen de Google en el token
  }
}