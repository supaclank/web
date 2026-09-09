<script>let { messages } = $props();</script>
{#each messages as message, index (message.id || index)}
  <article class="chat-message" class:from-user={message.role === 'user'}>
    <span class="message-author">{message.role === 'user' ? 'You' : message.role === 'tool' ? 'Agent activity' : 'Clank'}</span>
    {#if message.parts?.length}
      {#each message.parts as part, partIndex (part.id || partIndex)}
        {#if part.type === 'text'}<p>{part.text}</p>
        {:else if part.type === 'thinking'}<details class="tool-detail"><summary>Thinking</summary><p>{part.text}</p></details>
        {:else if part.type === 'tool_call' || part.type === 'tool_result'}<details class="tool-detail"><summary>{part.tool || 'Tool result'}<span>{part.status}</span></summary>{#if part.input}<pre>{JSON.stringify(part.input, null, 2)}</pre>{/if}{#if part.output}<pre>{part.output}</pre>{/if}</details>{/if}
      {/each}
    {:else if message.content}<p>{message.content}</p>{/if}
  </article>
{/each}
