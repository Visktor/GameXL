import { useState } from "react";
import SignInForm from "@/routes/login/sign-in/sign-in-form";
import SignUpForm from "./sign-up/sign-up-form";

export default function Login() {
	const [showSignIn, setShowSignIn] = useState(false);

	return showSignIn ? (
		<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
	) : (
		<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
	);
}
