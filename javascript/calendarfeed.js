/*
 * Licensed to the Sakai Foundation (SF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The SF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

/*jslint vars: true, nomen: true, maxerr: 50, maxlen: 80, indent: 4 */
/*jslint plusplus: true */

var require, sakai_global, alert;

/**
 * @param {String}
 *            tuid Unique id of the widget
 * @param {Boolean}
 *            showSettings Show the settings of the widget or not
 */
sakai_global.calendarfeed = function (tuid, showSettings) {
    "use strict";

    // More jslint lint: pre-declaring functions ahead of use required...
    var dateToday, buildAbsoluteDateString, getDayDelta,
        buildRelativeDateString, buildTimeString, paragraphBreak,
        hideLoadingIndicator, doInit, fetchCalendarData, showLoadingIndicator,
        parseEventDates, addDays, between, groupByDay, updateCalendar,
        stripTime, rewriteHttpUrlToWebcal, expandCalendarEntry,
        contractCalendarEntry, defaultingStateLoadHandler, randomErrorTitle,
        showError, onStateAvailable, isFinite, dateTomorrow, notBefore,
        compareEventByStartDate, getState, buildVeryRelativeDateString,
        rewriteWebcalUrlToHttp, onWidgetSettingsStateAvailable,
        setupRangeSlider, settingsHandleRangeSlide, settingsSave,
        onWidgetSettingsDataSaved;

    /** 
     * No-op function which can be called with unused function arguments whose 
     * presense are required by external APIs which this code has control over.
     * 
     *  JSLint thinks it's helpful to moan that an argument is unused, even 
     *  though its presence can't be avoided without stupid hacks like using the
     *  arguments array.
     */
    var stopJSLintMoaningAboutThisUnusedVarWhichICanDoNothingAbout =
        function () {};

    // Pull require() imports into local scope
    var $ = sakai_global.calendarfeed.imports.jquery;
    var sakai = sakai_global.calendarfeed.imports.sakai;

    var ICAL_PROXY_PATH = "/var/proxy/ical.json";

    // By default show events from 2 days ago up to 2 weeks in the future
    var DEFAULT_DISPLAY_RANGE = [ -2, 14 ];
    var MIN_SLIDER_DATE = -61;
    var MAX_SLIDER_DATE = 61;

    // Length of one day in milliseconds
    var DAY_MILLIS = 1000 * 60 * 60 * 24;

    // This doesn't seem to work so I'll hard code the values for now :(
    // sakai.api.i18n.getValueForKey("ERROR_UNCONFIGURED_BODY");
    var ERROR_UNCONFIGURED_BODY = "<p>Looks like this Calendar Feed widget " +
            "has not yet been configured. If you're not the owner of it then" +
            " hold tight. Hopefully its owner will configure it soon.</p>" +

            "<p>If you <em>are</em> the owner of it, you'll need to start " +
            "editing this page, then click on the widget in the edit view to " +
            "access its settings.</p>";

    var ERROR_GETTING_STATE = "<p>This widget couldn't get through to its " +
            "host website. This site may be experiencing difficulties, or " +
            "there may be a problem with your internet connection.</p>" +

            "<p>The chances are this will resolve itself very soon. Press " +
            "the retry button and cross your fingers…</p>" +

            "<div><button type='button' id='error_retry_btn' " +
            "class='s3d-button s3d-large-button'>Try Again</button></div>";

    var ERROR_GETTING_FEED = "<p>This widget couldn't access its calendar " +
            "feed. The website the feed is from may be experiencing " +
            "difficulties, or there may be a problem with your internet " +
            "connection.</p>" +

            "<p>The chances are this will resolve itself very soon. Press " +
            "the <em>try again</em> button and cross your fingers…</p>" +

            "<div><button type='button' id='error_retry_btn' " +
            "class='s3d-button s3d-large-button'>Try Again</button></div>";

    /*
     * This widget couldn't get through to the website. The site may by
     * experiencing difficulties, or there may be a problem with your internet
     * connection.
     * 
     * The chances are this will resolve itself very soon. Press the retry
     * button and cross your fingers…
     */
    /*
     * Some light hearted exclamations to show at the top of the error box.
     */
    var LIGHT_HEARTED_ERROR_TITLES = [ "Fiddlesticks!", "Oh dear…",
            "Dagnabbit!", "Oops…", "What A Kerfuffle!" ];

    // ///////////////////////////
    // Configuration variables //
    // ///////////////////////////

    // unique container for each widget instance
    var $rootel = $("#" + tuid);
    var $mainContainer = $("#calendarfeed_main", $rootel);
    var $settingsContainer = $("#calendarfeed_settings", $rootel);
    var settingsForm = $("#calendarfeed_settings_form", $rootel);
    var settingsFormTitleField = $("#calendarfeed_settings_txtTitle", $rootel);
    var settingsFormUrlField = $("#calendarfeed_settings_txtUrl", $rootel);

    // Widget state vars
    var _title = null;
    var _feedUrl = null;
    var _groupedDays = null;
    var _totalFeedEvents = null;

    // Settings state
    var _settingsDateRange = null;

    var DAYS = {
        "0" : "Mon",
        "1" : "Tue",
        "2" : "Wed",
        "3" : "Thu",
        "4" : "Fri",
        "5" : "Sat",
        "6" : "Sun"
    };

    var MONTHS = {
        "0" : "Jan",
        "1" : "Feb",
        "2" : "Mar",
        "3" : "Apr",
        "4" : "May",
        "5" : "Jun",
        "6" : "Jul",
        "7" : "Aug",
        "8" : "Sep",
        "9" : "Oct",
        "10" : "Nov",
        "11" : "Dec"
    };

    /**
     * A class to represent events.
     */
    function Event(vevent) {

        this.vevent = vevent;
        this.absDate = buildAbsoluteDateString(vevent.DTSTART);
        this.dayDelta = getDayDelta(dateToday(), vevent.DTSTART);
        this.relDate = buildRelativeDateString(this.dayDelta);
        this.time = buildTimeString(vevent.DTSTART);
        this.summary = vevent.SUMMARY || vevent.DESCRIPTION || "";
        this.description = vevent.DESCRIPTION || vevent.SUMMARY || "";
        if (this.description === this.summary) {
            this.description = "";
        }
        this.description = paragraphBreak(this.description);

        // These fields may be undefined
        this.url = vevent.URL;
        this.location = vevent.LOCATION;
        this.contact = vevent.CONTACT;
    }

    // /////////////////////
    // Utility functions //
    // /////////////////////

    paragraphBreak = function (text) {
        // Break the text on blank lines
        return text.split(/^\s*$/m);
    };

    /**
     * Builds a callback function to be passed to loadWidgetData which detects
     * load failure due to no previous state being saved and calls the callback
     * with success and some default values instead of failure.
     * 
     * By default, loadWidgetData makes no distinction between failure to load
     * state due to the widget being loaded for the first time, and failure due
     * to network error (for example).
     */
    defaultingStateLoadHandler = function (callback, defaults) {
        // Return a callback function to be registered with loadWidgetData
        return function (success, obj) {
            if (!success) {
                var xhr = obj;

                // Check for failure to load due to no previous state being
                // saved. i.e. use defaults.
                if (xhr.status === 404) {
                    // fire the callback with success instead of failure
                    // using the defaults provided
                    callback(true, defaults);
                } else {
                    // Otherwise, assume it's a legitimate failure
                    callback(false, xhr);
                }
            } else {
                callback(true, obj);
            }

        };
    };

    randomErrorTitle = function () {
        var len = LIGHT_HEARTED_ERROR_TITLES.length;
        return LIGHT_HEARTED_ERROR_TITLES[Math.floor(Math.random() * len)];
    };

    /**
     * Shows an error message with the given error body. postInsertHook will be
     * called once the message has been inserted with the error body as its this
     * value.
     */
    showError = function (bodyHtml, postInsertHook) {
        var rendered = sakai.api.Util.TemplateRenderer("#template_error_msg", {
            title : randomErrorTitle(),
            body : bodyHtml
        });
        var errorElement = $("#error_msg", $rootel);
        $("#error_msg", $rootel).html(rendered).slideDown();
        if (postInsertHook) {
            postInsertHook.call(errorElement);
        }
    };

    /**
     * Called when the widget state becomes available to the main widget (not
     * settings).
     */
    onStateAvailable = function (succeeded, state) {

        // Check if the request for our state failed...
        if (!succeeded) {
            hideLoadingIndicator();

            return showError(ERROR_GETTING_STATE, function () {
                $("#error_msg #error_retry_btn", $rootel).click(function (e) {
                    // re initialise after finishing hiding the error msg
                    $(e.target).slideUp(doInit);
                });
            });
        }

        // Check if the widget is yet to be configured, and if so show a
        // message.
        if (state.unconfigured) {
            hideLoadingIndicator();
            return showError(ERROR_UNCONFIGURED_BODY);
        }

        // Should be all good!
        _title = state.title;
        _feedUrl = state.url;
        _settingsDateRange = [ state.daysFrom, state.daysTo ];
        fetchCalendarData();
    };

    fetchCalendarData = function () {
        var failure = function () {
            hideLoadingIndicator();
            showError(ERROR_GETTING_FEED, function () {
                // Bind the "try again" button to hide the error message
                // and retry the operation.
                $("#error_msg #error_retry_btn", $rootel).click(function () {

                    $("#error_msg", $rootel).slideUp(function () {
                        // Once the error box has slid away, show the
                        // loading wheel and fetch the data again.
                        showLoadingIndicator();
                        fetchCalendarData();
                    });
                });

            });
        };
        var success = function (data) {
            // The proxy's iCalendar post processor is broken -- it returns
            // 200 success when it gets a bad response from the origin
            // server... We'll have to attempt to detect failure here:
            if (!data) {
                return failure();
            }

            // Hopefully the data is OK.
            if (data.vcalendar && data.vcalendar.vevents) {
                var events = data.vcalendar.vevents;
                _totalFeedEvents = events.length;

                // Convert event date strings into date objects
                events = $.map(events, parseEventDates);

                // Filter the events to just those happening today
                var range = (_settingsDateRange || DEFAULT_DISPLAY_RANGE);
                var startDate = (isFinite(range[0]) ? addDays(dateToday(),
                        range[0]) : null);
                // add one as between() excludes the upper endpoint, but the
                // slider is inclusive.
                var endDate = (isFinite(range[1]) ? addDays(dateToday(),
                        range[1] + 1) : null);
                events = $.grep(events, between(startDate, endDate));

                // Group the events into a list of groups, one for each day
                _groupedDays = groupByDay(events);

            }
            updateCalendar();
        };

        $.ajax({
            url : ICAL_PROXY_PATH,
            data : {
                feedurl : _feedUrl
            },
            success : success,
            failure : failure
        });
    };

    isFinite = function (dayDelta) {
        return dayDelta < MAX_SLIDER_DATE && dayDelta > MIN_SLIDER_DATE;
    };

    parseEventDates = function (event) {
        event.DTSTART = new Date(event.DTSTART);
        event.DTEND = new Date(event.DTEND);
        return event;
    };

    dateToday = function () {
        return stripTime(new Date());
    };

    dateTomorrow = function () {
        var today = dateToday();
        today.setDate(today.getDate() + 1);
        return today;
    };

    notBefore = function (date) {
        return function (event) {
            return event.DTSTART >= date;
        };
    };

    between = function (dateStart, dateEnd) {
        return function (event) {
            if (dateStart && dateEnd) {
                return event.DTSTART >= dateStart && event.DTSTART < dateEnd;
            }
            if (dateStart) {
                return event.DTSTART >= dateStart;
            }
            if (dateEnd) {
                return event.DTSTART < dateEnd;
            }
            return true;
        };
    };

    compareEventByStartDate = function (a, b) {
        return a.vevent.DTSTART.getTime() - b.vevent.DTSTART.getTime();
    };

    groupByDay = function (vevents) {
        var i, key, days = {};
        for (i = 0; i < vevents.length; ++i) {
            var event = vevents[i];
            // We need a string to key our obj with
            var dateKey = stripTime(event.DTSTART).toISOString();
            if (!days[dateKey]) {
                days[dateKey] = [];
            }
            days[dateKey].push(new Event(event));
        }
        var sortedDays = [];
        for (key in days) {
            if (days.hasOwnProperty(key)) {
                var events = days[key];
                events.sort(compareEventByStartDate);
                sortedDays.push([ key, events ]);
            }
        }
        sortedDays.sort();
        return sortedDays;
    };

    stripTime = function (date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    /**
     * Loads widget saved state, calling the callback(success, data) function
     * once the state is loaded.
     */
    getState = function (callback) {
        // Load widget data, providing default values on loads before state
        // has been saved on the server.
        sakai.api.Widgets.loadWidgetData(tuid, defaultingStateLoadHandler(
            callback,
            {
                unconfigured : true,
                title : "",
                url : "",
                daysFrom : DEFAULT_DISPLAY_RANGE[0],
                daysTo : DEFAULT_DISPLAY_RANGE[1]
            }
        ));
    };

    // ///////////////////////
    // Main View functions //
    // ///////////////////////

    /** Called when the calendar data has been updated. */
    updateCalendar = function () {

        var rendered = sakai.api.Util.TemplateRenderer("#agenda_template", {
            title : _title,
            webcalFeedUrl : rewriteHttpUrlToWebcal(_feedUrl),
            days : _groupedDays,
            totalFeedEvents : _totalFeedEvents
        });

        $(".ajax-content", $rootel).html(rendered);
        $(".ajax-content .summary.compact", $rootel).toggle(
            expandCalendarEntry,
            contractCalendarEntry
        );

        $(".ajax-content", $rootel).show();
        hideLoadingIndicator();
        $("#title", $rootel).hover(function (e) {
            $(e.target).children().fadeIn();
        }, function (e) {
            $(e.target).children().fadeOut();
        });
    };

    /**
     * Add some days to a date.
     * 
     * @param date
     *            The date to add the days to.
     * @param days
     *            The number of days to add (can be fractional, e.g. 1.6 days).
     */
    addDays = function (date, days) {
        var millis = date.getTime();
        millis += days * DAY_MILLIS;
        return new Date(millis);
    };

    hideLoadingIndicator = function () {
        $(".loading", $rootel).stop().hide();
    };

    showLoadingIndicator = function () {
        $(".loading", $rootel).fadeIn(1000);
    };

    buildTimeString = function (date) {
        var hour = date.getHours();
        var minute = String(date.getMinutes());
        if (minute.length === 1) {
            minute = "0" + minute;
        }
        return hour + ":" + minute;
    };

    getDayDelta = function (from, to) {
        // Millisecond time @ start of today
        var fromms = stripTime(from).getTime();
        var toms = stripTime(to).getTime();
        // Calculate number of days between from and to.
        return Math.floor((toms - fromms) / DAY_MILLIS);
    };

    /**
     * Builds a relative date string from an integer day delta. Day deltas can
     * be calculated by getDayDelta().
     * 
     * For example: buildRelativeDateString(0) => "Today"
     * buildRelativeDateString(-1) => "Yesterday" buildRelativeDateString(1) =>
     * "Tomorrow" buildRelativeDateString(-10) => "10 days ago"
     * buildRelativeDateString(10) => "In 10 days"
     */
    buildRelativeDateString = function (delta) {
        // make sure we have an integer
        var days = Math.floor(delta);
        if (days === 0) {
            return "Today";
        }
        if (days === 1) {
            return "Tomorrow";
        }
        if (days === -1) {
            return "Yesterday";
        }
        if (days < 0) {
            return String(Math.abs(days)) + " days ago";
        }
        return "In " + days + " days time";
    };

    /**
     * Builds relative date strings which are even more relative than
     * buildRelativeDateString() in that it doesn't refer to Today/Yesterday etc
     * which could confuse people in the context of choosing a general sliding
     * time window to show events inside.
     */
    buildVeryRelativeDateString = function (delta) {
        var days = Math.floor(delta);
        if (days === 0) {
            return "the present day";
        }
        if (days < 0) {
            return String(Math.abs(days)) + " days in the past";
        }
        return String(days) + " days in the future";
    };

    buildAbsoluteDateString = function (date) {
        var dayName = DAYS[date.getDay()];
        var dayNumber = date.getDate();
        var monthName = MONTHS[date.getMonth()];
        return dayName + " " + dayNumber + " " + monthName;
    };

    expandCalendarEntry = function (e) {
        var summary = $(e.target);
        var expanded = summary.siblings(".full");

        summary.removeClass("compact expandable").addClass("contractable");
        expanded.slideDown();
    };

    contractCalendarEntry = function (e) {
        var summary = $(e.target);
        var expanded = summary.siblings(".full");

        summary.addClass("compact expandable").removeClass("contractable");
        expanded.slideUp();
    };

    // ///////////////////////////
    // Settings View functions //
    // ///////////////////////////

    /**
     * Watch for value changes to the settings URL field in order to rewrite
     * webcal:// urls to http://.
     */
    settingsFormUrlField.change(function (e) {
        var urltext = $(e.target).val();
        // Help people inputting webcal:// links by rewriting them to http
        urltext = rewriteWebcalUrlToHttp(urltext);
        $(e.target).val(urltext);
    });

    rewriteWebcalUrlToHttp = function (url) {
        return url.replace(/^webcal:\/\//, "http://");
    };

    rewriteHttpUrlToWebcal = function (url) {
        return url.replace(/^http:\/\//, "webcal://");
    };

    onWidgetSettingsStateAvailable = function (success, state) {
        var title, url;
        if (success) {
            title = state.title;
            url = state.url;
            if (state.daysFrom && state.daysTo) {
                _settingsDateRange = [ state.daysFrom, state.daysTo ];
            }
        } else {
            alert("Error fetching saved settings");
        }
        settingsFormTitleField.val(title || "");
        settingsFormUrlField.val(url || "");
        setupRangeSlider($("#daterangeslider", $rootel),
                settingsHandleRangeSlide);
        $("#daterangeslider", $rootel).slider("values",
                _settingsDateRange || DEFAULT_DISPLAY_RANGE);
    };

    /** Add listener to setting form submit */
    settingsSave = function () {
        var state = {
            title : settingsFormTitleField.val(),
            url : settingsFormUrlField.val(),
            daysFrom : _settingsDateRange[0],
            daysTo : _settingsDateRange[1]
        };

        // async save our widget's state
        sakai.api.Widgets
                .saveWidgetData(tuid, state, onWidgetSettingsDataSaved);
    };

    onWidgetSettingsDataSaved = function (success) {
        if (success) {
            // Settings finished, switch to Main view
            sakai.api.Widgets.Container.informFinish(tuid, "calendarfeed");
        } else {
            sakai.api.Util.notification.show("Couldn't Save Your Settings",
                    "An error prevented your settings from being saved. "
                            + " Please try again.",
                    sakai.api.Util.notification.type.ERROR);
        }
    };

    // ///////////////////////////
    // Initialisation function //
    // ///////////////////////////

    setupRangeSlider = function (container, slideFunc) {
        stopJSLintMoaningAboutThisUnusedVarWhichICanDoNothingAbout(container);
        $("#daterangeslider", $rootel).slider({
            range : true,
            min : MIN_SLIDER_DATE,
            max : MAX_SLIDER_DATE,
            values : _settingsDateRange || DEFAULT_DISPLAY_RANGE,
            slide : slideFunc,
            change : slideFunc
        });
    };

    settingsHandleRangeSlide = function (event, ui) {
        stopJSLintMoaningAboutThisUnusedVarWhichICanDoNothingAbout(event);
        _settingsDateRange = ui.values;
        var from = ui.values[0];
        var to = ui.values[1];

        var fromString = !isFinite(from) ? "any date in the past"
                : buildVeryRelativeDateString(from);
        var toString = !isFinite(to) ? "any date in the future"
                : buildVeryRelativeDateString(to);

        $("#calendarfeed_settings_daterangeslider_label .from", $rootel).text(
            fromString
        );
        $("#calendarfeed_settings_daterangeslider_label .to", $rootel).text(
            toString
        );
    };

    /**
     * Initialization function DOCUMENTATION
     */
    doInit = function () {

        if (showSettings) {
            // Setup validation/save handler on save button
            var validateOpts = {
                submitHandler : settingsSave
            };
            sakai.api.Util.Forms.validate(settingsForm, validateOpts, true);

            $("#calendarfeed_settings_save", $rootel).click(function () {
                settingsForm.submit();
            });
            // Hook up the cancel button
            $("#calendarfeed_settings_cancel", $rootel).click(function () {
                sakai.api.Widgets.Container.informCancel(tuid, "calendarfeed");
            });

            // Async fetch widget settings to populate form
            getState(onWidgetSettingsStateAvailable);

            // show the Settings view
            $settingsContainer.show();
        } else {
            // set up Main view

            // Async fetch widget settings to populate form
            getState(onStateAvailable);

            $mainContainer.show();
            showLoadingIndicator();
        }
    };

    // run the initialization function when the widget object loads
    doInit();
};

// load the master sakai object to access all Sakai OAE API methods
require(
    ["jquery", "sakai/sakai.api.core",
        "/devwidgets/calendarfeed/lib/jquery.ui.slider.js"],
    function (jquery, sakai) {

        "use strict";

        sakai_global.calendarfeed.imports = {
            jquery : jquery,
            sakai : sakai
        };

        // inform Sakai OAE that this widget has loaded and is ready to run
        sakai.api.Widgets.widgetLoader.informOnLoad("calendarfeed");
    }
);
