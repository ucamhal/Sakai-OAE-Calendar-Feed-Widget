# Calendar Feed Widget

This is a Sakai OAE Widget which shows iCalendar (webcal://) feeds.

It should live in a directory called calendarfeed/ under devwidgets/ in your
3akai-ux/ directory (assuming you want to install it, rather than just have it
burn disk space).

## Packaging

Run `build.sh` in the project root to build a widget zip archive for 
distribution (calendarfeed.zip):

    hwtb2@pebble:~/Documents/workspace/calendarfeed> ./build.sh 
    Building calendarfeed version: v0.0.1

    Rebuilding bundles from src-bundles...
    Building default.properties...done

    Building widget zip archive (calendarfeed-v0.0.1.zip)...
    /tmp/calendarfeed.UMC91c ~/Documents/workspace/calendarfeed
    updating: calendarfeed/ (stored 0%)
    updating: calendarfeed/bundles/ (stored 0%)
    updating: calendarfeed/bundles/default.properties (deflated 56%)
    updating: calendarfeed/calendarfeed.html (deflated 75%)
    updating: calendarfeed/config.json (deflated 63%)
    updating: calendarfeed/css/ (stored 0%)
    updating: calendarfeed/css/calendarfeed.css (deflated 68%)
    updating: calendarfeed/images/ (stored 0%)
    updating: calendarfeed/images/calendarfeed.png (deflated 11%)
    updating: calendarfeed/images/external.png (stored 0%)
    updating: calendarfeed/javascript/ (stored 0%)
    updating: calendarfeed/javascript/calendarfeed.js (deflated 71%)
    updating: calendarfeed/lib/ (stored 0%)
    updating: calendarfeed/lib/dates.js (deflated 67%)
    updating: calendarfeed/lib/jquery.ui.slider.js (deflated 76%)
    updating: calendarfeed/VERSION (stored 0%)

    Written calendarfeed-v0.0.1.zip

Also `clean.sh` to delete generated .properties and the widget zip archive.
