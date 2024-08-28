import { SignIn } from '@clerk/nextjs'

const SignInPage = () => {
  return (
    <main className="auth-page font-normal">
      <SignIn />
    </main>
  )
}

export default SignInPage