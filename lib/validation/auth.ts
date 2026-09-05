// lib/validation/auth.ts
import { z } from 'zod'

// 🔐 Схема валидации регистрации
export const registerSchema = z.object({
  login: z
    .string()
    .min(3, 'Логин должен быть минимум 3 символа')
    .max(20, 'Логин не может быть длиннее 20 символов')
    .regex(/^[a-zA-Z0-9_]+$/, 'Логин может содержать только буквы, цифры и подчёркивание')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Пароль должен быть минимум 8 символов')
    .max(100, 'Пароль слишком длинный')
    .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
    .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру')
    .regex(/[^A-Za-z0-9]/, 'Пароль должен содержать хотя бы один спецсимвол'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

// 🔐 Схема валидации входа
export const loginSchema = z.object({
  login: z
    .string()
    .min(1, 'Введите логин')
    .max(20, 'Логин не может быть длиннее 20 символов')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Введите пароль')
    .max(100, 'Пароль слишком длинный'),
})

// 🔐 Схема для смены пароля
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z
    .string()
    .min(8, 'Пароль должен быть минимум 8 символов')
    .max(100, 'Пароль слишком длинный')
    .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
    .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру')
    .regex(/[^A-Za-z0-9]/, 'Пароль должен содержать хотя бы один спецсимвол'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>