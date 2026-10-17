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
            client: true,
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
          departmentId: user.employee?.departmentId,
          department: user.employee?.department?.name || (user.client ? (user.client.departmentType === "DIGITAL_MARKETING" ? "Digital Marketing" : "Technical") : undefined),
          designation: user.employee?.designation?.name || (user.client ? "Client Account" : undefined),
          clientId: user.client?.id,
          clientCode: user.client?.clientCode,
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
        token.departmentId = (user as any).departmentId;
        token.department = (user as any).department;
        token.designation = (user as any).designation;
        token.clientId = (user as any).clientId;
        token.clientCode = (user as any).clientCode;
      }

      // If token is missing departmentId or employee/client info, query DB to keep session synced
      if (token.id && (!token.role || (!token.employeeId && !token.clientId))) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            employee: {
              include: { department: true, designation: true },
            },
            client: true,
          },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.employeeId = dbUser.employee?.id;
          token.employeeCode = dbUser.employee?.employeeCode;
          token.departmentId = dbUser.employee?.departmentId;
          token.department = dbUser.employee?.department?.name || (dbUser.client ? (dbUser.client.departmentType === "DIGITAL_MARKETING" ? "Digital Marketing" : "Technical") : undefined);
          token.designation = dbUser.employee?.designation?.name || (dbUser.client ? "Client Account" : undefined);
          token.clientId = dbUser.client?.id;
          token.clientCode = dbUser.client?.clientCode;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).employeeId = token.employeeId;
        (session.user as any).employeeCode = token.employeeCode;
        (session.user as any).departmentId = token.departmentId;
        (session.user as any).department = token.department;
        (session.user as any).designation = token.designation;
        (session.user as any).clientId = token.clientId;
        (session.user as any).clientCode = token.clientCode;
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
