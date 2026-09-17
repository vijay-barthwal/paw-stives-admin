"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { useAdminSession } from "@/components/auth/admin-session-provider"
import { Button } from "@/components/segments/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/segments/form"
import { Input } from "@/components/segments/input"
import { MaterialIcon } from "@/components/segments/material-icon"
import { PasswordInput } from "@/components/segments/password-input"
import { ApiError } from "@/lib/api-client"
import { loginDefaultValues, loginSchema, type LoginValues } from "@/lib/validation/auth"

function LoginForm() {
  const router = useRouter()
  const { login } = useAdminSession()
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaultValues,
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      await login(values.email, values.password)
      router.replace("/")
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Something went wrong signing in.")
    }
  })

  const { isSubmitting } = form.formState

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="flex w-full max-w-sm flex-col gap-space-md">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  placeholder="admin@pawstives.dev"
                  className="h-12 rounded-xl border-transparent bg-surface-container-low px-space-md"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-transparent bg-surface-container-low px-space-md"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError && (
          <p className="font-body-sm text-body-sm rounded-xl bg-error-container px-space-md py-space-sm text-on-error-container">{submitError}</p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-primary font-label-lg text-label-lg font-bold text-on-primary shadow-md hover:bg-primary-container"
        >
          {isSubmitting ? (
            <>
              <MaterialIcon name="progress_activity" size={18} className="animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </Button>
      </form>
    </Form>
  )
}

export { LoginForm }
