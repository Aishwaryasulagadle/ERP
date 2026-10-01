import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            employee: {
              include: {
                department: true,
                designation: true,
              },
            },
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordMatch = await bcrypt.compare(
          String(credentials.password),
          user.password
        );

        if (!isPasswordMatch) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employee?.id,
          employeeCode: user.employee?.employeeCode,
          department: user.employee?.department?.name,
          designation: user.employee?.designation?.name,
          image: user.image || user.employee?.profilePhoto,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.employeeId = (user as any).employeeId;
        token.employeeCode = (user as any).employeeCode;
        token.department = (user as any).department;
        token.designation = (user as any).designation;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).employeeId = token.employeeId;
        (session.user as any).employeeCode = token.employeeCode;
        (session.user as any).department = token.department;
        (session.user as any).designation = token.designation;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "erp-secret-key-development",
});
