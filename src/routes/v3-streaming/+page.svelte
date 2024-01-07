<script lang="ts">
	import { AppBar, Avatar } from "@skeletonlabs/skeleton";

	import { Amplify } from "aws-amplify";
	import amplifyconfig from "../../amplifyconfiguration.json";
	Amplify.configure(amplifyconfig);

	import { Hub } from "aws-amplify/utils";
	import {
		fetchAuthSession,
		getCurrentUser,
		signInWithRedirect,
		signOut,
	} from "aws-amplify/auth";

	import {
		BedrockRuntimeClient,
		InvokeModelWithResponseStreamCommand,
	} from "@aws-sdk/client-bedrock-runtime";

	Hub.listen("auth", async ({ payload }) => {
		console.log(payload);
		switch (payload.event) {
			case "signInWithRedirect":
				getUser();
				break;
		}
	});

	function handleSignInClick() {
		signInWithRedirect();
	}

	function handleSignOutClick() {
		signOut();
	}

	let isAuthorizedUser = false;

	async function getUser() {
		try {
			const user = await getCurrentUser();
			if (user.userId) {
				isAuthorizedUser = true;
			}
		} catch (Exception) {
			isAuthorizedUser = false;
		}
	}

	getUser();

	async function invokeBedrock(prompt: string): Promise<string> {
		const history = chatHistory
			.map((x) => `${x.prefix}: ${x.message}`)
			.join("\n");

		const client = new BedrockRuntimeClient({
			region: amplifyconfig.aws_project_region,
			credentials: (await fetchAuthSession()).credentials,
		});

		const params = {
			modelId: "anthropic.claude-instant-v1",
			contentType: "application/json",
			accept: "*/*",
			body: JSON.stringify({
				prompt: `\n\nHuman: \n${history}\n\n${prompt}\n\nAssistant:`,
				max_tokens_to_sample: 1000,
				temperature: 0.5,
				top_k: 250,
				top_p: 1,
				stop_sequences: ["\n\nHuman:"],
			}),
		};

		const command = new InvokeModelWithResponseStreamCommand(params);
		const response = await client.send(command);

		completion = "";
		if (response.body) {
			const textDecoder = new TextDecoder("utf-8");

			for await (const stream of response.body) {
				const chunk = textDecoder.decode(stream.chunk?.bytes);
				completion = completion + JSON.parse(chunk)["completion"];
			}
		}

		chatHistory = [
			...chatHistory,
			{
				prefix: "H",
				message: prompt,
			},
			{
				prefix: "A",
				message: completion,
			},
		];

		const tmp = completion;
		completion = "";

		return tmp;
	}

	let messageFeed = [
		{
			id: 1,
			host: false,
			name: "Claude",
			timestamp: `Today @ ${getCurrentTimestamp()}`,
			message: "こんにちは。何か話しかけてください。",
			color: "variant-glass-primary",
		},
	];

	type chat = {
		prefix: string;
		message: string;
	};

	let chatHistory: chat[] = [];

	let currentMessage = "";
	let completion = "";

	let elemChat: HTMLElement;

	function scrollChatBottom(behavior?: ScrollBehavior): void {
		elemChat.scrollTo({ top: elemChat.scrollHeight, behavior });
	}

	function getCurrentTimestamp(): string {
		return new Date().toLocaleString("en-US", {
			hour: "numeric",
			minute: "numeric",
			hour12: true,
		});
	}

	function addMessage(): void {
		const newMessage = {
			id: messageFeed.length,
			host: true,
			name: "あなた",
			timestamp: `Today @ ${getCurrentTimestamp()}`,
			message: currentMessage,
			color: "variant-glass-tertiary",
		};
		// Update the message feed
		messageFeed = [...messageFeed, newMessage];

		const tmpMessage = currentMessage;

		addAiMessage(tmpMessage);

		// Clear prompt
		currentMessage = "";
		// Smooth scroll to bottom
		// Timeout prevents race condition
		setTimeout(() => {
			scrollChatBottom("smooth");
		}, 0);
	}

	async function addAiMessage(userMessage: string): Promise<void> {
		const newMessage = {
			id: messageFeed.length,
			host: false,
			name: "Claude",
			timestamp: `Today @ ${getCurrentTimestamp()}`,
			message: await invokeBedrock(userMessage),
			color: "variant-glass-primary",
		};
		// Update the message feed
		messageFeed = [...messageFeed, newMessage];

		// Smooth scroll to bottom
		// Timeout prevents race condition
		setTimeout(() => {
			scrollChatBottom("smooth");
		}, 0);
	}

	function onPromptKeydown(event: KeyboardEvent): void {
		if (event.ctrlKey && ["Enter"].includes(event.code)) {
			event.preventDefault();
			addMessage();
		}
	}
</script>

<div class="h-dvh w-full gap-1">
	<div class="h-full grid grid-rows-[auto_1fr]">
		<AppBar
			gridColumns="grid-cols-2"
			slotDefault="place-self-left"
			slotTrail="place-content-end"
		>
			チャットアプリ（v3-streaming）
			<svelte:fragment slot="trail">
				{#if isAuthorizedUser}
					<button
						type="button"
						class="btn btn-sm variant-filled-primary"
						on:click={handleSignOutClick}>ログアウト</button
					>
				{:else}
					<button
						type="button"
						class="btn btn-sm variant-filled-primary"
						on:click={handleSignInClick}>ログイン</button
					>
				{/if}
			</svelte:fragment>
		</AppBar>
		<div class="h-full bg-surface-500/30 p-4">
			{#if isAuthorizedUser}
				<div class="h-full grid grid-rows-[1fr_auto] gap-1">
					<div class="h-full bg-surface-500/30 table p-4 overflow-y-auto">
						<section
							bind:this={elemChat}
							class="h-full p-4 overflow-y-auto space-y-4"
						>
							{#each messageFeed as bubble, i}
								{#if bubble.host === true}
									<div class="grid grid-cols-[auto_1fr] gap-2">
										<Avatar
											initials="😀"
											width="w-12"
											fontSize={320}
											background={bubble.color}
										/>
										<div
											class="card p-4 rounded-tl-none space-y-2 {bubble.color}"
										>
											<header class="flex justify-between items-center">
												<p class="font-bold">{bubble.name}</p>
												<small class="opacity-50">{bubble.timestamp}</small>
											</header>
											<p>{bubble.message}</p>
										</div>
									</div>
								{:else}
									<div class="grid grid-cols-[1fr_auto] gap-2">
										<div
											class="card p-4 rounded-tr-none space-y-2 {bubble.color}"
										>
											<header class="flex justify-between items-center">
												<p class="font-bold">{bubble.name}</p>
												<small class="opacity-50">{bubble.timestamp}</small>
											</header>
											<p>{bubble.message}</p>
										</div>
										<Avatar
											initials="🤖"
											width="w-12"
											fontSize={320}
											background={bubble.color}
										/>
									</div>
								{/if}
							{/each}

							{#if completion}
								<div class="grid grid-cols-[1fr_auto] gap-2">
									<div
										class="card p-4 rounded-tr-none space-y-2 variant-glass-error"
									>
										<header class="flex justify-between items-center">
											<p class="font-bold">Claude</p>
											<small class="opacity-50"
												>{`Today @ ${getCurrentTimestamp()}`}</small
											>
										</header>
										<p>{completion}</p>
									</div>
									<Avatar
										initials="🤖"
										width="w-12"
										fontSize={320}
										background="variant-glass-error"
									/>
								</div>
							{/if}
						</section>
					</div>
					<div class="bg-surface-500/30 p-4">
						<div
							class="input-group input-group-divider grid-cols-[auto_1fr_auto] rounded-container-token"
						>
							<button class="input-group-shim">+</button>
							<textarea
								bind:value={currentMessage}
								class="bg-transparent border-0 ring-0"
								name="prompt"
								id="prompt"
								placeholder="Write a message..."
								rows="1"
								on:keydown={onPromptKeydown}
							/>
							<button class="variant-filled-primary" on:click={addMessage}
								>Send</button
							>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
