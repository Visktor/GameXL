import { Toaster } from "@GameXL/ui/components/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect } from "react";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router";

import "./index.css";
import ErrorPage from "./components/error-page";
import { GamePreviewPanel } from "./components/game-preview-panel";
import Header from "./components/header";
import { SearchCommandDialog } from "./components/search-command-dialog";
import { ThemeProvider } from "./components/theme-provider";
import Home from "./routes/_index";
import GameDetails from "./routes/game-details";
import MyList from "./routes/list";
import Login from "./routes/login/login";
import Profile from "./routes/profile";
import Search from "./routes/search";
import { useSessionStore } from "./stores/session-store";
import { queryClient } from "./utils/trpc";

function RootLayout() {
	const initFingerprint = useSessionStore((s) => s.initFingerprint);

	useEffect(() => {
		initFingerprint();
	}, [initFingerprint]);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				disableTransitionOnChange
				storageKey="vite-ui-theme"
			>
				<div className="grid h-svh grid-rows-[auto_1fr]">
					<Header />
					<div className="flex overflow-hidden">
						<div className="min-w-0 flex-1 overflow-hidden">
							<Outlet />
						</div>
						<GamePreviewPanel />
					</div>
				</div>
				<SearchCommandDialog />
				<Toaster richColors />
			</ThemeProvider>
			{import.meta.env.DEV && (
				<ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
			)}
		</QueryClientProvider>
	);
}

const router = createBrowserRouter([
	{
		element: <RootLayout />,
		errorElement: <ErrorPage />,
		children: [
			{ index: true, element: <Home /> },
			{ path: "/login", element: <Login /> },
			{ path: "/search", element: <Search /> },
			{ path: "/games/:igdbId", element: <GameDetails /> },
			{ path: "/list", element: <MyList /> },
			{ path: "/u/:username", element: <Profile /> },
		],
	},
]);

export default function App() {
	return <RouterProvider router={router} />;
}
