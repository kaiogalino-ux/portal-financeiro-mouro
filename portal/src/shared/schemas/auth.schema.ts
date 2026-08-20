import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.'),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });
