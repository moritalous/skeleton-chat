<script lang="ts">
	import { Avatar } from "@skeletonlabs/skeleton";

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

	let currentMessage = "";

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
		setTimeout(() => {
			addAiMessage(tmpMessage);
		}, 1000);

		// Clear prompt
		currentMessage = "";
		// Smooth scroll to bottom
		// Timeout prevents race condition
		setTimeout(() => {
			scrollChatBottom("smooth");
		}, 0);
	}

	function addAiMessage(userMessage: string): void {
		const newMessage = {
			id: messageFeed.length,
			host: false,
			name: "Claude",
			timestamp: `Today @ ${getCurrentTimestamp()}`,
			message: `あなたは「${userMessage}」といいました。`,
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

<div class="h-screen w-full gap-1">
	<div class="h-full bg-surface-500/30 p-4">
		<div class="h-full grid grid-rows-[1fr_auto] gap-1">
			<div class="h-full bg-surface-500/30 p-4 overflow-y-auto">
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
								<div class="card p-4 rounded-tl-none space-y-2 {bubble.color}">
									<header class="flex justify-between items-center">
										<p class="font-bold">{bubble.name}</p>
										<small class="opacity-50">{bubble.timestamp}</small>
									</header>
									<p>{bubble.message}</p>
								</div>
							</div>
						{:else}
							<div class="grid grid-cols-[1fr_auto] gap-2">
								<div class="card p-4 rounded-tr-none space-y-2 {bubble.color}">
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
	</div>
</div>
