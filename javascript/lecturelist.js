	// load the master sakai object to access all Sakai OAE API methods
require(["jquery", 
         "sakai/sakai.api.core",
         "/devwidgets/lecturelist/javascript/jquery.ui.slider.js"], 
        function($, sakai, jqui) {
	
	console.log({jquery: $});
    /**
     * @name sakai.WIDGET_ID
     *
     * @class WIDGET_ID
     *
     * @description
     * WIDGET DESCRIPTION
     *
     * @version 0.0.1
     * @param {String} tuid Unique id of the widget
     * @param {Boolean} showSettings Show the settings of the widget or not
     */
	sakai_global.lecturelist = function (tuid, showSettings) {
         
		var ICAL_PROXY_PATH = "/var/proxy/ical.json"
			
		var LECTURE_ENTRY = $("#lecturelist_templates .entry", $rootel);
		var AGENDA_ROW = $("#lecturelist_templates .agenda-row", $rootel);
		/////////////////////////////
        // Configuration variables //
        /////////////////////////////
		
    	// DOM jQuery Objects
        var $rootel = $("#" + tuid);  // unique container for each widget instance
        var $mainContainer = $("#lecturelist_main", $rootel);
        var $settingsContainer = $("#lecturelist_settings", $rootel);
        var settingsForm = $("#lecturelist_settings_form", $rootel);
        var settingsFormTitleField = $("#lecturelist_settings_txtTitle", $rootel);
        var settingsFormUrlField = $("#lecturelist_settings_txtUrl", $rootel);
        
        // Widget state vars
        var _title = null;
        var _feedUrl = null;
        var _groupedDays = null;
        
        // Settings state
        var _settingsDateRange = null;
        
        DAYS = {"0": "Mon",
        		"1": "Tue",
        		"2": "Wed",
        		"3": "Thu",
        		"4": "Fri",
        		"5": "Sat",
        		"6": "Sun"};

        MONTHS = {"0": "Jan",
        		  "1": "Feb",
        		  "2": "Mar",
        		  "3": "Apr",
        		  "4": "May",
        		  "5": "Jun",
        		  "6": "Jul",
        		  "7": "Aug",
        		  "8": "Sep",
        		  "9": "Oct",
        		  "10": "Nov",
        		  "11": "Dec"};
        
        var TODAY = dateToday();
        
        /**
         * A class to represent events.
         */
    	function Event(vevent) {
    		
    		function paragraphBreak(text) {
    			// Break the text on blank lines
    			return text.split(/^\s*$/m);
    		}
    		
    		this.vevent = vevent;
    		this.absDate = buildAbsoluteDateString(vevent.DTSTART);
    		this.dayDelta = getDayDelta(TODAY, vevent.DTSTART);
    		this.relDate = buildRelativeDateString(this.dayDelta);
    		this.time = buildTimeString(vevent.DTSTART);
    		this.summary = vevent.SUMMARY || vevent.DESCRIPTION || "";
    		this.description = vevent.DESCRIPTION || vevent.SUMMARY || "";
    		if(this.description == this.summary) {
    			this.description = "";
    		}
    		this.description = paragraphBreak(this.description);
    		
    		// These fields may be undefined
    		this.url = vevent.URL;
    		this.location = vevent.LOCATION;
    		this.contact = vevent.CONTACT;
    	}
        
        ///////////////////////
        // Utility functions //
        ///////////////////////
        
        function onStateAvailable(succeeded, state) {
        	if(!succeeded) {
        		alert("Failed to fetch widget state.");
        		return;
        	}
        	
        	_title = state.title;
        	_feedUrl = state.url;
        	fetchCalendarData();
        }
        
        function fetchCalendarData() {
        	var success = function(data) {
        		if(data.vcalendar && data.vcalendar.vevents) {
        			var events = data.vcalendar.vevents;
        			
        			// Convert event date strings into date objects
        			events = $.map(events, parseEventDates);
        			
        			// Filter the events to just those happening today
        			//events = $.grep(events, notBefore(dateToday()));
        			
        			// Group the events into a list of groups, one for each day
        			_groupedDays = groupByDay(events);
        			
        		}
        		updateCalendar();
        	};
        	
        	$.ajax({
        		url: ICAL_PROXY_PATH,
        		data: {feedurl: _feedUrl},
        		success: success});
        }
        
        function parseEventDates(event) {
        	event.DTSTART = new Date(event.DTSTART);
        	event.DTEND = new Date(event.DTEND);
        	return event;
        }
        
        function dateToday() {
        	return stripTime(new Date());
        }
        function dateTomorrow() {
        	var today = dateToday();
        	today.setDate(today.getDate() + 1);
        	return today;
        }
        
        function notBefore(date) {
        	return function(event) {
        		return event.DTSTART >= date;
        	}
        }
        
        function between(dateStart, dateEnd) {
        	return function(event) {
        		return event.dtstart >= dateStart && event.dstart < dateEnd;
        	}
        }
        
        function groupByDay(vevents) {
        	var days = {}
        	for(var i = 0; i < vevents.length; ++i) {
        		var event = vevents[i];
        		// We need a string to key our obj with
        		var dateKey = stripTime(event.DTSTART).toISOString();
        		if(!days[dateKey]) {
        			days[dateKey] = []
        		}
        		days[dateKey].push(new Event(event));
        	}
        	var sortedDays = [];
        	for(key in days) {
        		var events = days[key];
        		events.sort(function(a, b){
        			return a.vevent.DTSTART.milliseconds - b.vevent.DTSTART.milliseconds;
        		});
        		sortedDays.push([key, events]);
        	}
        	sortedDays.sort(function(a, b) {
        		if(a[0] < b[0])
        			return -1;
        		else if(a[0] > b[0])
        			return 1;
        		return 0;
        	});
        	
        	return sortedDays;
        }
        
        function stripTime(date) {
        	return new Date(date.getFullYear(), date.getMonth(), 
        			date.getDate());
        }
        
        /** 
         * Loads widget saved state, calling the callback(success, data) 
         * function once the state is loaded.
         */
        function getState(callback) {
        	sakai.api.Widgets.loadWidgetData(tuid, callback);
        }
        
        /////////////////////////
        // Main View functions //
        /////////////////////////

        /** Called when the calendar data has been updated. */
        function updateCalendar() {
        	
        	var rendered = sakai.api.Util.TemplateRenderer("#agenda_template", {
				title: _title,
				webcalFeedUrl: rewriteHttpUrlToWebcal(_feedUrl),
				days: _groupedDays
			});
        	
        	$(".ajax-content", $rootel).html(rendered);
        	$(".ajax-content .summary.compact", $rootel).toggle(
        			expandCalendarEntry, contractCalendarEntry);
        	$(".loading", $rootel).hide();
        	$(".ajax-content", $rootel).show();
        	
        	$("#title", $rootel).hover(function() {
        		$(this).children().fadeIn();
        	}, function(){
        		$(this).children().fadeOut();	
        	})
        }
        
        function buildTimeString(date) {
        	var hour = date.getHours();
        	var minute = "" + date.getMinutes();
        	if(minute.length === 1)
        		minute = "0" + minute;
        	return hour + ":" + minute;
        }
        
        // Length of one day in milliseconds
        var DAY_MILLIS = 1000*60*60*24;
        var MAX_DAYS_AGO = 5;
        
        function getDayDelta(from, to) {
        	// Millisecond time @ start of today
        	var fromms = stripTime(from).getTime(); 
        	var toms = stripTime(to).getTime();
        	// Calculate number of days between from and to.
        	return Math.floor((toms - fromms) / DAY_MILLIS);
        }
        
        /**
         * Builds a relative date string from an integer day delta. Day deltas 
         * can be calculated by getDayDelta().
         * 
         * For example:
         * buildRelativeDateString(0) => "Today"
         * buildRelativeDateString(-1) => "Yesterday"
         * buildRelativeDateString(1) => "Tomorrow"
         * buildRelativeDateString(-10) => "10 days ago"
         * buildRelativeDateString(10) => "In 10 days"
         */
        function buildRelativeDateString(delta) {
        	// make sure we have an integer
        	var days = Math.floor(delta);
        	if(days == 0)
				return "Today";
			else if(days == 1)
				return "Tomorrow";
			else if(days == -1)
				return "Yesterday";
			else if(days < 0)
				return "" + Math.abs(days) + " days ago";
			else
				return "In " + days + " days time";

        }
        
        /**
         * Builds relative date strings which are even more relative than
         * buildRelativeDateString() in that it doesn't refer to Today/Yesterday
         * etc which could confuse people in the context of choosing a general
         * sliding time window to show events inside.
         */
        function buildVeryRelativeDateString(delta) {
        	var days = Math.floor(delta);
        	if(days == 0)
        		return "the present day";
        	else if(days < 0)
        		return "" + Math.abs(days) + " days in the past";
        	else // days > 0
        		return "" + days + " days in the future";
        }
        
        function buildAbsoluteDateString(date) {
        	var dayName = DAYS[date.getDay()];
        	var dayNumber = date.getDate();
        	var monthName = MONTHS[date.getMonth()];
        	return dayName + " " + dayNumber + " " + monthName;
        }
        
        function expandCalendarEntry(jqevent) {
        	var summary = $(this);
        	var expanded = summary.siblings(".full");
        	
        	summary.removeClass("compact expandable").addClass("contractable");
        	expanded.slideDown();
        }
        
        function contractCalendarEntry(jqevent) {
        	var summary = $(this);
        	var expanded = summary.siblings(".full");
        	
        	summary.addClass("compact expandable").removeClass("contractable");
        	expanded.slideUp();
        }

        /////////////////////////////
        // Settings View functions //
        /////////////////////////////

        /**
         * Watch for value changes to the settings URL field in order to rewrite 
         * webcal:// urls to http://.
         */
        settingsFormUrlField.change(function() {
        	var urltext = $(this).val();
        	// Help people inputting webcal:// links by rewriting them to http
        	urltext = rewriteWebcalUrlToHttp(urltext);
        	$(this).val(urltext);
        });
        
        function rewriteWebcalUrlToHttp(url) {
        	return url.replace(/^webcal:\/\//, "http://");
        }
        
        function rewriteHttpUrlToWebcal(url) {
        	return url.replace(/^http:\/\//, "webcal://");
        }

        function onWidgetSettingsStateAvailable(success, state) {
        	if(success) {
	        	settingsFormTitleField.val(state.title);
	        	settingsFormUrlField.val(state.url);
	        	
        	}
        	else {
        		alert("Error fetching saved settings");
        	}
        }

        /** Add listener to setting form submit */
        function settingsSave() {
        	var state = {
        			title: settingsFormTitleField.val(),
        			url: settingsFormUrlField.val(),
        			daysFrom: _settingsDateRange[0],
        			daysTo: _settingsDateRange[1]
        	};
        	
        	// async save our widget's state
        	sakai.api.Widgets.saveWidgetData(tuid, state, 
        			onWidgetSettingsDataSaved);
        }
        
        function onWidgetSettingsDataSaved(success, data) {
        	if (success) {
        		// Settings finished, switch to Main view
        		sakai.api.Widgets.Container.informFinish(tuid, "lecturelist");
        	} else {
        		sakai.api.Util.notification.show("Couldn't Save Your Settings", 
        				"An error prevented your settings from being saved. "
        				+ " Please try again.",
        				sakai.api.Util.notification.type.ERROR);
        	}
        }
        
        /////////////////////////////
        // Initialisation function //
        /////////////////////////////
        
        // By default show events from 2 days ago up to 2 weeks in the future
        var DEFAULT_DISPLAY_RANGE = [-2, 14];
        var MIN_SLIDER_DATE = -61;
        var MAX_SLIDER_DATE = 61;
        
        function setupRangeSlider(container, slideFunc) {
        	$("#daterangeslider", $rootel).slider({
        		range: true,
        		min: -61,
        		max: 61,
        		values: DEFAULT_DISPLAY_RANGE,
        		slide: slideFunc
        	});
        }
        
        function settingsHandleRangeSlide(event, ui) {
        	_settingsDateRange = ui.values;
        	var from = ui.values[0];
        	var to = ui.values[1];
        	
        	var fromString = from <= MIN_SLIDER_DATE ? "any date in the past"
        			: buildVeryRelativeDateString(from);
        	var toString = to >= MAX_SLIDER_DATE ? "any date in the future"
        			: buildVeryRelativeDateString(to);
        	
        	$("#lecturelist_settings_daterangeslider_label .from", $rootel)
        		.text(fromString);
        	$("#lecturelist_settings_daterangeslider_label .to", $rootel)
        		.text(toString);
        }
        
        /**
         * Initialization function DOCUMENTATION
         */
        var doInit = function () {
            
            if (showSettings) {
            	// Setup validation/save handler on save button
            	var validateOpts = { submitHandler: settingsSave };
                sakai.api.Util.Forms.validate(settingsForm, validateOpts, true);
            	
                // Hook up the cancel button
                $("#lecturelist_settings_cancel", $rootel).click(function(){
            		sakai.api.Widgets.Container.informCancel(
            				tuid, "lecturelist");
            	});
                
                setupRangeSlider($("#daterangeslider", $rootel), 
                		settingsHandleRangeSlide);
                
                // Async fetch widget settings to populate form
                getState(onWidgetSettingsStateAvailable);
                
                // show the Settings view
                $settingsContainer.show();
            } else {
            	// set up Main view

            	// Async fetch widget settings to populate form
                getState(onStateAvailable);
                
            	$mainContainer.show();
            	$(".loading", $rootel).fadeIn(1000);
            }
        };
        
        // run the initialization function when the widget object loads
        doInit();
    };

    // inform Sakai OAE that this widget has loaded and is ready to run
    sakai.api.Widgets.widgetLoader.informOnLoad("lecturelist");
});
