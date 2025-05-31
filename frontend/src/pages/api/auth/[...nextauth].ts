import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { Profile } from "next-auth"
import { authService } from "@/services/api"

// Extended Profile interface to include Google-specific fields
interface GoogleProfile extends Profile {
  picture?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // When the user authenticates
      if (account && account.id_token) {
        try {
          // Send Google's Token to our API
          const response = await authService.loginWithGoogle(account.id_token);
          
          // Add the Token Jwt from our API to the token from Nexthouth
          token.accessToken = response.accessToken;
          token.user = response.user;
          
          // Preserve Google's profile image in case the API does not return it
          if (profile) {
            const googleProfile = profile as GoogleProfile;
            if (googleProfile.image || googleProfile.picture) {
              token.userImage = googleProfile.image || googleProfile.picture;
            }
          }
          
        } catch (error) {
          console.error("Error during authentication with API:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Pass the access token to the session
      session.accessToken = token.accessToken as string;
      
      // Update user data with our API information
      if (token.user) {
        session.user = token.user as any;
        
        // Make sure there is an image
        // First we try to use the API propilepicture, then Image of Token, and finally the image of Google
        if (!session.user.image) {
          // Use empty string instead of null as fallback
          session.user.image = session.user.profilePicture || (token.userImage as string) || "";
        }
      }
      
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET
}

export default NextAuth(authOptions)