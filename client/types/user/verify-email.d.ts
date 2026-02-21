export interface VerifyEmailRequest {
  token: string
}

export interface ResendVerificationEmailRequest {
  email: string
}

export interface VerifyEmailResponse {
  success: boolean
  message: string
}
