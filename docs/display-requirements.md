# Display requirements and troubleshooting

This page explains what a TV, kiosk, or digital signage player needs in order to show a
Mobility Screens set, and what to check when a screen does not look right.

A published screen set is a web page, for example `https://movingny.org/GW9Q7W?mode=tv`.
Any device that can open that page in a web browser can show it. Add `?mode=tv` to the URL
so the slides rotate full screen.

## Minimum requirements

| What | Minimum | Notes |
|---|---|---|
| Web browser | Chrome 63 or newer | Also Edge 79+, Firefox 67+, or Safari 12+. Most signage players (BrightSign and others) use a built-in version of Chrome. |
| Map slides | Chrome 80 or newer, with WebGL 2 graphics | Applies to the Transit Route Destination Map Page, Micromobility Page, and Route Times Page. See "Map slides" below. |
| Internet access | Always on | Arrival times and other live data refresh about once a minute. |
| Screen resolution | Any | Slides scale to fit. Pick the resolution in the editor that matches the screen (for example 1280x720 or 1920x1080). |
| Clock and time zone | Set correctly | Times on the screen use the device's own clock and time zone. |

### Websites the device must be able to reach

If the screen is on a network with a firewall or content filter, these addresses need to be
allowed:

- `movingny.org` - the screen pages themselves
- `api.etch.app` - screen settings, arrival times, and other live data
- `511ny.etch.app` - trip planning data
- `diy-public-transit-screens.s3.amazonaws.com` - uploaded images and logos
- `api.mapbox.com` and `events.mapbox.com` - map slides only

## Map slides

Maps need a newer browser (Chrome 80 or newer) and graphics support (WebGL 2). Many older
signage players, such as BrightSign players with Chrome 63 to 79, cannot draw maps.

On a display that cannot draw maps, the map slide shows this message for its turn in the
rotation, and the other slides keep working:

> **This map can't be shown on this display**
> The web browser on this display is too old to draw maps.

To fix it, do one of these:

1. **Remove the map slide.** Open the screen set in the editor, delete (or hide) the slide
   named in the message, and publish again.
2. **Upgrade the display.** Update the player's software, or use a newer player or browser
   that meets the map requirement above.

## Checking a new display

Before putting a screen into service:

1. Open the screen set URL with `?mode=tv` on the actual display, not just on a computer.
2. Watch it through at least one full rotation of slides.
3. Check that each slide shows real content: arrival times, text, images, and logos.
4. Check that the clock in the footer shows the correct local time.
5. If the set has a map slide, check that the map draws, or that you see the "This map can't
   be shown" message (see "Map slides" above).

## What to look for

**The whole screen stays black or dark gray and never shows a slide.**
The display's browser is older than the minimum (Chrome 63), or it is blocking scripts on the
page. Check the browser version (see below). If it is older than Chrome 63, the player needs a
software update or replacement. Also make sure the device can reach the websites listed above.

**A slide says "This map can't be shown on this display".**
The browser works but is too old for maps. Remove the map slide or upgrade the display. See
"Map slides" above.

**A logo or image is missing, or shows a small broken-image icon.**
The image file is no longer available. Open the screen set in the editor, upload the image
again in the slide or footer settings, and publish. This can happen when a screen set was
copied from another set and the original set later replaced or removed that image.

**Times are off by a few hours, or the date is wrong.**
The device's clock or time zone is wrong. Set the correct time zone on the player.

**Arrival times are missing or never change.**
Check that the device can reach `api.etch.app`. If other screens show times for the same stop
and this one does not, reload the page on the player or restart it.

**Spacing between items looks tighter than in the editor.**
Older browsers (Chrome 63 to 83) ignore some spacing settings. The content is still correct.
Upgrading the player fixes it.

## Finding the browser version on a display

- **On most devices:** open a browser on the display and visit a "what is my browser" site,
  such as `https://www.whatismybrowser.com`. It shows the browser name and version.
- **On BrightSign players:** find the BrightSign OS version in BrightAuthor:connected or on the
  player's diagnostic web page. BrightSign's documentation lists which Chrome version each OS
  version includes.

## Information to send when asking for help

- The screen set URL
- The make and model of the player or TV, and its software or OS version
- The browser version, if you can find it
- A photo of the screen
- What you expected to see, and what you see instead
