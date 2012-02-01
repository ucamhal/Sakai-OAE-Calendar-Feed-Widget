// load the master sakai object to access all Sakai OAE API methods
require(["jquery", 
         "sakai/sakai.api.core", 
         "/devwidgets/lecturelist/javascript/jquery.icalendar.js"], 
        function($, sakai) {
	
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
         
        /////////////////////////////
        // Configuration variables //
        /////////////////////////////

    	// DOM jQuery Objects
        var $rootel = $("#" + tuid);  // unique container for each widget instance
        var $mainContainer = $("#lecturelist_main", $rootel);
        var $settingsContainer = $("#lecturelist_settings", $rootel);
        
        var BASE_URL = "http://localhost/php/gcal.php"
        var SUBJECT_ID = "T0024001692011001,T0024001692011012";
        
        var LECTURE_ENTRY = $("#lecturelist_templates .entry", $rootel);
        var AGENDA_ROW = $("#lecturelist_templates .agenda-row", $rootel);

        var BSLASH_REGEX = new RegExp('\\\\', 'g');
        
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
        
        ///////////////////////
        // Utility functions //
        ///////////////////////
        
        function fetchCalendarData() {
        	var success = function(data) {
        		var ical = $.icalendar.parse(data.calendardata);
        		var days = groupByDay(
        				$.grep(ical.vevent, notBefore(stripTime(new Date()))));
        		showCalendar({name: ical["x-wr-calname"]._value, days: days});
        	};
        	
        	$.ajax({
        		url: BASE_URL,
        		data: {course: SUBJECT_ID, type: "ical"},
        		dataType: 'jsonp',
        		success: success});
        }
        
        function notBefore(date) {
        	return function(event) {
        		return event.dtstart >= date;
        	}
        }
        
        function groupByDay(vevents) {
        	var days = {}
        	for(var i = 0; i < vevents.length; ++i) {
        		var event = vevents[i];
        		// We need a string to key our obj with
        		var dateKey = stripTime(event.dtstart).toISOString();
        		if(!days[dateKey]) {
        			days[dateKey] = []
        		}
        		days[dateKey].push(event);
        	}
        	var sortedDays = [];
        	for(key in days) {
        		sortedDays.push([key, days[key]]);
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
        
        /////////////////////////
        // Main View functions //
        /////////////////////////

        /** Called when the timetable lecture data has been recieved. */
        function showCalendar(calendar) {
        	$(".lecture-subject", $rootel).text("Lectures of " + calendar.name);
        	var agendaTable = $("#lecturelist_lectures #agenda", $rootel);
        	console.log(agendaTable);
        	for(var i = 0; i < calendar.days.length; ++i) {
        		var day = calendar.days[i];
        		var dayDateStr = day[0];
        		var entries = day[1];
        		appendDaysToTable(agendaTable, new Date(dayDateStr), entries);
        	}
        	
        	$(".loading", $rootel).hide();
        	$(".ajax-content", $rootel).show();
        }
        
        /**
         * @param table A JQuery wrapper of the element to insert the days into.
         * @param day A Date object representing the day.
         * @param events A list of events occuring on a single day.
         */
        function appendDaysToTable(table, day, events) {
        	var root = $("<tbody>");
        	for(var i = 0; i < events.length; ++i) {
        		var event = events[i];
        		var tr = buildRow(event);
        		if(i === 0) { // first
        			tr.prepend($("<td class='date'>")
        					.text(buildDateString(day))
        					.attr("rowspan", events.length));
        		}
        		
        		root.append(tr);
        	}
        	table.append(root);
        }
        
        function buildRow(event) {
        	var root = $("<tr>");
        	root.append($("<td class='time'>").text(
        			buildTimeString(event.dtstart)));
        	root.append($("<td class='description'>").text(
        			event.summary.replace(BSLASH_REGEX, "")));
        	return root;
        }
        
        function buildTimeString(date) {
        	var hour = date.getHours();
        	var minute = "" + date.getMinutes();
        	if(minute.length === 1)
        		minute = "0" + minute;
        	return hour + ":" + minute;
        }
        
        function buildDateString(date) {
        	var dayName = DAYS[date.getDay()];
        	var dayNumber = date.getDate();
        	var monthName = MONTHS[date.getMonth()];
        	return dayName + " " + dayNumber + " " + monthName;
        }

        /////////////////////////////
        // Settings View functions //
        /////////////////////////////



        ////////////////////
        // Event Handlers //
        ////////////////////



        /////////////////////////////
        // Initialization function //
        /////////////////////////////
        
        /**
         * Initialization function DOCUMENTATION
         */
        var doInit = function () {
            console.log("lecturelist doInit()");
            
            // Trigger async fetch of calendar data
            fetchCalendarData();
            
            if (showSettings) {
                // show the Settings view
                $settingsContainer.show();
            } else {
                // set up Main view
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
