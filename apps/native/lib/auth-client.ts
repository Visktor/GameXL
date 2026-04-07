import { env } from "@GameXL/env/native";
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import { getItemAsync, setItemAsync } from "expo-secure-store";

export const authClient = createAuthClient({
	baseURL: env.EXPO_PUBLIC_SERVER_URL,
	plugins: [
		expoClient({
			scheme: Constants.expoConfig?.scheme as string,
			storagePrefix: Constants.expoConfig?.scheme as string,
			storage: {
				setItem: (key: string, value: string) => setItemAsync(key, value),
				getItem: (key: string) => getItemAsync(key) as unknown as string | null,
			},
		}),
	],
});
