# Design System Specification: The Intelligent Atheneum

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Curator"**
This design system moves beyond the utility of a standard database to the elegance of a high-end editorial experience. It is designed for a Smart AI-Powered Library & Campus System that feels less like a software tool and more like a scholarly sanctuary. 

We achieve this through **Soft Minimalism**: a philosophy that prioritizes breathing room, intentional asymmetry, and tactile depth. By blending the precision of Stripe with the spatial logic of Notion, we create a "Living Library" where information isn't just stored—it is showcased. Expect large display type, overlapping glass surfaces, and a rejection of the "boxed-in" grid in favor of fluid, organic compositions.

---

## 2. Colors & Surface Architecture
The palette is rooted in deep academic blues and intellectual purples, executed through a sophisticated layering system rather than flat fills.

### The Color Logic
*   **Primary Identity:** A core gradient transitioning from `primary_container` (#2563EB) to `secondary_container` (#8A4CFC). Use this for high-impact moments and primary CTAs.
*   **Tonal Depth:** Surfaces are not "white" or "black"—they are tinted environments. Use `surface_container_lowest` (#FFFFFF) for interactive elements on top of `surface` (#F8F9FA) backgrounds.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined through background color shifts.
*   *Correct:* A `surface_container_low` card sitting on a `surface` background.
*   *Incorrect:* A white card with a #EEEEEE border.

### The "Glass & Gradient" Rule
To achieve the signature "Smart AI" feel, floating navigation bars and modal overlays must utilize **Glassmorphism**:
*   **Fill:** `surface` at 70% opacity.
*   **Effect:** Backdrop-blur (12px to 20px).
*   **Texture:** Main CTAs should use a subtle linear gradient (135°) from `primary` to `secondary` to provide a "glow" that flat colors cannot replicate.

---

## 3. Typography: Editorial Authority
We pair the structural reliability of **Inter** for UI with the sophisticated, wide-set proportions of **Manrope** for storytelling.

*   **Display (Manrope, Bold):** Used for AI-generated insights and hero welcomes. The scale is aggressive (`display-lg` at 3.5rem) to create an editorial "magazine" feel.
*   **Headlines (Manrope, Semi-Bold):** Used for section headers. These should feel authoritative and provide clear landmarks.
*   **Body (Inter, Regular):** Optimized for long-form reading of research abstracts and campus news. Line height should be generous (1.6x) to ensure legibility.
*   **Labels (Inter, Medium):** Used for metadata (ISBNs, Room Numbers). These are always in `on_surface_variant` (#434655) to reduce visual noise.

---

## 4. Elevation & Depth: The Layering Principle
Hierarchy is communicated through **Tonal Layering** rather than traditional structural lines or heavy drop shadows.

*   **The Stacking Order:** 
    1.  Base: `surface`
    2.  Section: `surface_container_low`
    3.  Interactive Element (Card): `surface_container_lowest`
*   **Ambient Shadows:** For "floating" elements like AI suggestions or hover-state cards, use a "Cloud Shadow": `Y: 20px, Blur: 40px, Color: on_surface @ 4% opacity`. This mimics natural light diffusion.
*   **The "Ghost Border" Fallback:** If accessibility requires a container edge, use `outline_variant` (#C3C6D7) at **15% opacity**. It should be felt, not seen.
*   **Soft Glows:** Elements in an "Active" or "AI-Processing" state should emit a soft outer glow using the `primary_container` color at 20% opacity, blurred 16px.

---

## 5. Components & Interaction

### Buttons (The Interaction Anchor)
*   **Primary:** Large (56px height), `xl` (24px) corner radius. Gradient fill from `primary` to `secondary`. On hover: Scale 1.02, increase shadow spread.
*   **Secondary:** `surface_container_high` fill with `on_surface` text. No border.
*   **Tertiary:** Text-only in `primary`. On hover: A subtle `surface_container_lowest` background appears.

### Cards (The "Smart" Container)
*   **Style:** `xl` (24px) corner radius. No borders.
*   **Behavior:** Forbid divider lines within cards. Use `8px` grid-multiples of white space to separate the header from the body.
*   **The "AI-Badge":** Use a Glassmorphic chip for AI-suggested content, utilizing a `secondary_fixed` background with a subtle pulse animation.

### Input Fields
*   **Resting:** `surface_container_highest` background, `xl` corner radius, no border.
*   **Focused:** Transition background to `surface_container_lowest`. Add a "Ghost Border" of `primary` at 20% opacity. Label slides up and shrinks to `label-sm`.

### Additional Signature Components
*   **The Progress Orbit:** A circular, gradient-stroked loader for AI "Thinking" states.
*   **Live Availability Chips:** Pill-shaped indicators for library seats. Use `tertiary_container` for "Available" and `error_container` for "Full," but desaturate the colors to maintain the "Soft UI" aesthetic.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical padding. A card can have more padding on the bottom than the top to create a "weighted" editorial look.
*   **Do** use `8px` increments for all spacing. A `24px` (3x) gap is the system standard for internal card padding.
*   **Do** leverage "White Space as a Divider." If two sections look too close, increase the margin rather than adding a line.

### Don't:
*   **Don't** use pure black (#000000) or pure grey. Always use the `on_surface` (#191C1D) or `on_surface_variant` (#434655) tokens which contain a hint of blue/slate.
*   **Don't** use "Standard" 4px or 8px corners. This system is defined by its `lg` (16px) and `xl` (24px) softness.
*   **Don't** use high-contrast shadows. If the shadow looks like a shadow, it’s too dark. It should look like a "glow of depth."