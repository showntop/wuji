# Wuji / 无极 — Visual World

## World

**Night observatory / cartographer’s table.**  
The field is not a whiteboard decoration; it is the product. The canvas reads as a quiet, expansive night surface. Cards are crafted paper instruments floating above it. The palette is deliberately not the generic AI-purple gradient world.

## Tokens

```css
--ink: #07080d;
--ink-2: #10141d;
--paper: #f7f3ea;
--paper-muted: rgba(247, 243, 234, .68);
--line: rgba(247, 243, 234, .12);
--line-strong: rgba(247, 243, 234, .24);
--accent: #ff5a36;
--jade: #7de0c1;
--gold: #e7c877;
```

## Typography

- Display: `Songti SC`, `Noto Serif SC`, `Georgia`, serif.
- UI/body: `Avenir Next`, `PingFang SC`, `Inter`, system sans-serif.
- Chinese headings use a literary serif voice.
- Interface controls stay compact, legible, and sans-serif.

## Composition

- The canvas is the primary surface.
- Chrome is sparse: a small brand mark, one left tool rail, a zoom HUD, and one summon bar.
- Nodes are not decorative cards; each is an object in the workspace.
- Relations use thin connecting lines rather than boxes around boxes.

## Motion

- Motion is used for materialization and focus, not decoration.
- New nodes enter with a short opacity, scale, and blur transition.
- Agent work shows a restrained thinking state.
- Motion respects `prefers-reduced-motion`.

## Components

- **Summon bar:** centered, calm, universal entry point.
- **Field node:** compact paper panel with a drag rail, type marker, title, and editable body.
- **Relation line:** low-contrast by default, clearer when connected to a selected node.
- **Tool rail:** minimal icon instruments for creating and resetting.
- **Zoom HUD:** concrete spatial control for an otherwise infinite surface.
