# Wuji / 无极 — Product Brief

## Positioning

Wuji is a boundless agent workspace. It replaces the single vertical chat column with an infinite, spatial field where intents, evidence, plans, drafts, and actions persist as movable objects.

Chinese name: **无极**  
English name: **Wuji**  
Tagline: **没有边界，只有延展。**

## Audience

People who work across thinking and doing: founders, designers, researchers, students, planners, and operators. They do not only want answers; they want a place where an answer becomes a plan, a plan becomes objects, and objects become next actions.

## Core problem

Conventional assistant products collapse work into a transcript. Two failures follow from that single decision.

### Failure 1 — Linear conversation cannot represent thinking and execution

A chat column is a one-dimensional timeline. Real agent work is neither linear nor singular: it decomposes a goal, fans out into parallel retrieval, cross-checks sources, holds intermediate conclusions, revises them, and then acts. The transcript flattens all of that into one scrolling sequence.

- **Structure is lost.** Parallel branches get serialized; what was concurrent reads as sequential.
- **Intermediate artifacts are buried.** Evidence, rejected attempts, and half-formed plans scroll past and cannot be stopped, held, or rearranged.
- **The process cannot be audited or steered.** A person sees output, never the shape of the reasoning that produced it.
- **Nothing is reusable.** Yesterday's decomposition cannot be picked up and moved into today's plan.

The user ends up re-explaining the task every time, because the workspace never retained its shape.

### Failure 2 — CUI cannot adapt its interface to the shape of the content

Chat UI is one container for every kind of content. But content has shape, and shape demands a matching interaction surface.

- A dataset wants to be sorted, filtered, and pivoted — not printed as a markdown table.
- A plan wants to be checked off and reordered — not read as a numbered list.
- A decision wants to be chosen between — not described in prose.
- A diagram wants to be panned and zoomed — not rendered as a static fenced block.

CUI flattens all of these into a text block or code region. Interaction degrades to copy-and-paste. The richer the content, the harder the interface fights it.

### The shared root

Both failures come from the same decision: **the conversation is the container.**

Wuji inverts it. The container is a spatial field; a response is an object that carries its own interaction surface. Thinking becomes structure you can see. Content becomes an interface you can use.

## Core loop

1. **Cast** — type a goal into the summon bar from anywhere on the canvas.
2. **Materialize** — Wuji creates a connected intent node and an agent response node.
3. **Arrange** — drag, group, annotate, and connect results across the field.
4. **Continue** — select any object and keep asking; the assistant operates relative to spatial context.
5. **Persist** — return later; the field remains where the person left it.

## V0 interaction model

- Infinite pannable and zoomable canvas.
- Floating summon bar for universal requests.
- Node types: intent, note, agent response, task.
- Drag-and-drop spatial arrangement.
- Agent modes: plan, research, write, execute.
- Local persistence for prototype state.
- Double-click empty space to create a note.
- Keyboard nudging for the selected node.

## Product principles

1. **No forced column.** Work can grow in any direction.
2. **Objects over messages.** Every response should be manipulable.
3. **Context is visible.** Related items show their relation.
4. **Calm infinity.** Boundlessness must not become visual noise.
5. **Universal entry.** One input accepts planning, research, writing, and action.
6. **Process is spatial.** Thinking and execution appear as visible structure, not as a scroll of messages.
7. **Form follows content.** Every kind of content gets the interaction surface it needs — never a generic text block.

## Non-goals for the first prototype

- Real model calls.
- Multi-user collaboration.
- Mobile-native gestures.
- File upload and external tool execution.
- Authentication.

## Success signal

A person can arrive with a vague goal, place it on the field, receive a structured response, rearrange that response into their own work, and return without losing the arrangement.
