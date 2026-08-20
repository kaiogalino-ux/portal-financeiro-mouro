import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/server/db/prisma';
import { credentialsSchema } from '@/shared/schemas/common.schema';
import type { RoleName } from '@/shared/types/rbac.types';
import { verifyPassword } from './password';

/**
 * O tipo `JWT` exportado por "next-auth/jwt" nesta versão beta não reflete
 * de forma confiável os campos customizados nos callbacks abaixo — em vez
 * de depender de module augmentation frágil contra uma lib em beta, lemos e
 * escrevemos o token através deste tipo local explícito.
 */
interface AppToken {
  id: string;
  role: RoleName;
  active: boolean;
}

/**
 * O provider Credentials do Auth.js exige estratégia de sessão "jwt" (sessão
 * em banco só existe para contas OAuth). Para não perder o efeito imediato
 * de revogar usuário/mudar role — importante num sistema financeiro — o
 * callback `jwt` abaixo revalida `active`/`role` contra o banco a cada
 * requisição, em vez de confiar apenas no valor gravado no token no login.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        // Login é case-insensitive por convenção de e-mail — `mode:
        // 'insensitive'` casa "Financeiro@..." com "financeiro@..." sem
        // depender de como o e-mail foi digitado no cadastro do usuário.
        const user = await prisma.user.findFirst({
          where: { email: { equals: parsed.data.email, mode: 'insensitive' } },
        });
        if (!user || !user.active) return null;

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role, active: user.active };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const appToken = token as unknown as AppToken;
      if (user) {
        // user.id vem sempre preenchido aqui — authorize() acima sempre retorna um id.
        appToken.id = user.id!;
        appToken.role = user.role;
        appToken.active = user.active;
        return token;
      }

      if (appToken.id) {
        const current = await prisma.user.findUnique({ where: { id: appToken.id } });
        if (!current || !current.active) {
          appToken.active = false;
          return token;
        }
        appToken.role = current.role;
        appToken.active = current.active;
      }
      return token;
    },
    async session({ session, token }) {
      const appToken = token as unknown as AppToken;
      session.user.id = appToken.id;
      session.user.role = appToken.role;
      session.user.active = appToken.active;
      return session;
    },
  },
});
