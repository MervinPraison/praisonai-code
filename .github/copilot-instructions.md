# Praisonaicode Change Marking Guidelines

We are a fork of Roo. We regularly merge in the Roo codebase. To enable us to merge more easily, we mark all
our own changes with `praisonaicode_change` comments.

## Basic Usage

### Single Line Changes

For single line changes, add the comment at the end of the line:

```typescript
let i = 2 // praisonaicode_change
```

### Multi-line Changes

For multiple consecutive lines, wrap them with start/end comments:

```typescript
// praisonaicode_change start
let i = 2
let j = 3
// praisonaicode_change end
```

## Language-Specific Examples

### HTML/JSX/TSX

```html
{/* praisonaicode_change start */}
<CustomPraisonaiComponent />
{/* praisonaicode_change end */}
```

### CSS/SCSS

```css
/* praisonaicode_change */
.praisonaicode-specific-class {
	color: blue;
}

/* praisonaicode_change start */
.another-class {
	background: red;
}
/* praisonaicode_change end */
```

## Special Cases

### New Files

If you're creating a completely new file that doesn't exist in Roo, add this comment at the top:

```
// praisonaicode_change - new file
```

### Praisonaicode specific file - these rules take precedence over all other rules above

- if the filename or directory name contains praisonaicode no marking with comments is required
- all the following folders are praisonaicode-specific and need no marking with comments:
    - jetbrains/
    - cli/
    - src/services/ghost/
    - src/services/continuedev/
