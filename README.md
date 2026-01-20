# Project Setup and Architecture

## Installation and Development

This project uses **pnpm** as the package manager.

1.**Install pnpm** (if not already installed)

 ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
  ```

2.**Install dependencies**

 ```bash
   pnpm install
  ```
  
3.**Build the project**

 ```bash
   npx next build
  ```

4.**Start the development server**

```bash
   npx next dev
```

## Environment Variables

# Example

NEXT_PUBLIC_BACKEND_URL=<https://api.etch.app/nysdot-mobility-builder>
NEXT_PUBLIC_MAPBOX_KEY=your-mapbox-access-token

## Slide System Overview

The app uses a modular slide system with the following structure:

1. Slide Page
 • This is the main editing interface for a specific slide.
 • Used to configure content, layout, and settings for the slide.

2. Slide Preview Page
 • Displays the actual rendered slide content.
 • Intended to show the final appearance of the slide based on the current configuration.

3. Slide Store
 • Holds all data related to an individual slide.
 • Contains reactive state for slide-specific properties (text, images, layout settings, etc.).

## Slide Data Flow

 1. Adding a New Slide
 • Each slide is represented by an object:

```bash
{
  id: uuid,        // unique slide identifier
  type: templateId // identifies which template the slide uses
}
```

• This object is added to the slide stack in the general store.

 2. General Store <br>
 Stores overall screen configuration such as:<br>
 • Center coordinates
 • Slide stack (array of slide objects)
 • Address
 • Shortcode
 • Other shared data
 3. Services
 • publish.ts and setup.ts handle server-side or API-related actions involving slide data.
 • All slide information must be included in these services when publishing or initializing.

## Adding a New Slide Type

When adding a new slide type:

 1. Create the slide preview in components/slide-preview.
 2. Add the editing interface in components/slides.
 3. Define its state in a new store.
 4. Update publish.ts and setup.ts to handle the new slide’s data format.
 5. Ensure it integrates with the general store’s slide stack and editor/published page render() methods.
