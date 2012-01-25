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

// load the master sakai object to access all Sakai OAE API methods
require(["jquery", "sakai/sakai.api.core"], function($, sakai) {
     
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
        
        var BASE_URL = "http://localhost/php/calendar2.php?tripos-part="
        var TRIPOS_PART_ID = "T0024001692011";
        var SUBJECT_ID = "T0024001692011003";
        
        var LECTURE_ENTRY = $("#lecturelist_templates .entry", $rootel);

        ///////////////////////
        // Utility functions //
        ///////////////////////
        
        /**
         * Extract the information on a specific subject from a raw timetables
         * calendar (cal_*.json) document.
         * 
         * @param subjectId The ID of the subject to obtain.
         * @param calendar The calendar data.
         */
        function extractSubjectData(calendar, subjectId) {
        	var lectures = flattenSublists(calendar.rectangles);
        	
        	var subjectLectures = $.grep(lectures, function(l) {
        		return l.cid && l.cid === subjectId;
        	});
        	
        	var lectureData = $.map(subjectLectures, function(l) {
        		return {
        			title: l.what,
        			datetime: l.when,
        			location: l.where,
        			type: l.type,
        			presenter: l.organiser
        		}
        	});
        	
        	return {
        		subject: calendar.courses[subjectId].name,
        		lectures: lectureData
        	}
        }
        
        function flattenSublists(list, dest) {
        	if(!dest)
        		dest = [];
        	
        	for(var i = 0; i < list.length; ++i) {
        		var entry = list[i];
        		if($.type(entry) === "array") {
        			flattenSublists(entry, dest);
        		}
        		else {
        			dest.push(entry);
        		}
        	}
        	return dest;
        }
        
        function fetchCalendarData(triposPartId, subjectId) {
        	var success = function(data) {
        		showLectures(extractSubjectData(data, subjectId));
        	};
        	
        	$.ajax({
        		url: buildCalFeedUrl(triposPartId), 
        		dataType: 'jsonp', 
        		success: success});
        }
        
        function buildCalFeedUrl(triposPartId) {
        	return BASE_URL + triposPartId;
        }

        /////////////////////////
        // Main View functions //
        /////////////////////////

        /** Called when the timetable lecture data has been recieved. */
        function showLectures(lectures) {
        	// FIXME: Update UI
        	$(".lecture-subject", $rootel).text("Lectures of " + lectures.subject);
        	var entries = lectures.lectures;
        	var entryContainer = $("#lecturelist_lectures", $rootel);
        	for(var i = 0; i < entries.length; ++i) {
        		var entryData = entries[i];
        		var entryHtml = LECTURE_ENTRY.clone();
        		populateEntry(entryData, entryHtml).appendTo(entryContainer);
        	}
        	
        	$(".loading", $rootel).hide();
        	$(".ajax-content", $rootel).show();
        }
        
        function populateEntry(entryData, entryHtml) {
        	$(".lecture-title", entryHtml).text(entryData.title);
        	$(".lecture-presenter", entryHtml).text(entryData.presenter);
        	$(".lecture-datetime", entryHtml).text(entryData.datetime);
        	$(".lecture-location", entryHtml).text(entryData.location);
        	return entryHtml;
        }
        
        /** Called when the HTTP GET for the timetable data fails. */
        function showFetchLecturesFailed() {
        	// FIXME: show proper UI message
        	var msg = "Error fetching data from Timetables server.";
        	alert(msg);
        	console.log(msg);
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
            fetchCalendarData(TRIPOS_PART_ID, SUBJECT_ID);
            
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
