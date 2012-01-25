var icalParser={
	ical:{
		version:'',
		prodid:'',
		events:[],
		todos:[],
		journals:[],
		freebusys:[]
	},
	parseIcal: function(icsString){
		this.ical.version=this.getValue('VERSION',icsString);
		this.ical.prodid=this.getValue('PRODID',icsString);
		
		var reg=/BEGIN:VEVENT(\r?\n[^B].*)+/g;
		var matches=icsString.match(reg);
		if(matches){
			for(i=0;i<matches.length;i++){
				//console.log(matches[i]);
				this.parseVevent(matches[i]);
			}
		}
		reg=/BEGIN:VTODO(\r?\n[^B].*)+/g;
		matches=icsString.match(reg);
		if(matches){
			for(i=0;i<matches.length;i++){
				console.log('TODO=>'+matches[i]);
				this.parseVtodo(matches[i]);
			}
		}
		reg=/BEGIN:VJOURNAL(\r?\n[^B].*)+/g;
		matches=icsString.match(reg);
		if(matches){
			for(i=0;i<matches.length;i++){
				console.log('JOURNAL=>'+matches[i]);
				this.parseVjournal(matches[i]);
			}
		}
		reg=/BEGIN:VFREEBUSY(\r?\n[^B].*)+/g;
		matches=icsString.match(reg);
		if(matches){
			for(i=0;i<matches.length;i++){
				console.log('FREEBUSY=>'+matches[i]);
				this.parseVfreebusy(matches[i]);
			}
		}
		console.log('parsed');
		//alert(this.ical.events[0].start.params.valeurs);
	},
	parseVfreebusy: function(vfreeString){
		////PROCHAINE VERSION: Générer seul les propriétés trouvées : + rapide
		var freebusy={
			contact:this.getValue('CONTACT',vfreeString), //
			dtstart:this.getValue('DTSTART',veventString), //This property specifies when the calendar component begins.
			dtend:this.getValue('DTEND',veventString), //This property specifies when the calendar component ends.
			duration:this.getValue('DURATION',vfreeString), //
			description:this.getValue('DESCRIPTION',vfreeString), //This property provides a more complete description of the calendar component, than that provided by the "SUMMARY" property.
			dtstamp:this.getValue('DTSTAMP',vfreeString), //The property indicates the date/time that the instance of the iCalendar object was created.
			organizer:this.getValue('ORGANIZER',vfreeString), //The property defines the organizer for a calendar component.
			uid:this.getValue('UID',vfreeString), //This property defines the persistent, globally unique identifier for the calendar component.
			url:this.getValue('URL',vfreeString), //This property defines a Uniform Resource Locator (URL) associated with the iCalendar object.

			attendee:this.getValue('ATTENDEE',vfreeString,true), //The property defines an "Attendee" within a calendar component.
			comment:this.getValue('COMMENT',vfreeString,true), //This property specifies non-processing information intended to provide a comment to the calendar user.			
			freebusy:this.getValue('FREEBUSY',vfreeString,true), //The property defines one or more free or busy time intervals.
			rstatus:this.getValue('REQUEST-STATUS',vfreeString,true), //This property defines the status code returned for a scheduling request.			
			xprop:this.getValue('X-',vfreeString,true), //
		};
		this.ical.freebusys[this.ical.freebusys.length]=freebusy;
	},
	parseVjournal: function(vjournalString){
		////PROCHAINE VERSION: Générer seul les propriétés trouvées : + rapide
		var journal={
			class:this.getValue('CLASS',vjournalString), //This property defines the access classification for a calendar component.
			created:this.getValue('CREATED',vjournalString), //This property specifies the date and time that the calendar information was created by the calendar user agent in the calendar store.
			description:this.getValue('DESCRIPTION',vjournalString), //This property provides a more complete description of the calendar component, than that provided by the "SUMMARY" property.
			dtstart:this.getValue('DTSTART',veventString), //This property specifies when the calendar component begins.
			dtstamp:this.getValue('DTSTAMP',vjournalString), //The property indicates the date/time that the instance of the iCalendar object was created.
			lastmod:this.getValue('LAST-MODIFIED',vjournalString), //The property specifies the date and time that the information associated with the calendar component was last revised in the calendar store.
			organizer:this.getValue('ORGANIZER',vjournalString), //The property defines the organizer for a calendar component.
			recurid:this.getValue('RECURRENCE-ID',vjournalString), //This property is used in conjunction with the "UID" and "SEQUENCE" property to identify a specific instance of a recurring "VEVENT", "VTODO" or "VJOURNAL" calendar component. The property value is the effective value of the "DTSTART" property of the recurrence instance.
			seq:this.getValue('SEQUENCE',vjournalString), //This property defines the revision sequence number of the calendar component within a sequence of revisions.
			status:this.getValue('STATUS',vjournalString), //This property defines the overall status or confirmation for the calendar component.
			summary:this.getValue('SUMMARY',vjournalString), //This property defines a short summary or subject for the calendar component.
			uid:this.getValue('UID',vjournalString), //This property defines the persistent, globally unique identifier for the calendar component.
			url:this.getValue('URL',vjournalString), //This property defines a Uniform Resource Locator (URL) associated with the iCalendar object.

			attach:this.getValue('ATTACH',vjournalString,true), //The property provides the capability to associate a document object with a calendar component.
			attendee:this.getValue('ATTENDEE',vjournalString,true), //The property defines an "Attendee" within a calendar component.
			categories:this.getValue('CATEGORIES',vjournalString,true), //This property defines the categories for a calendar component.
			comment:this.getValue('COMMENT',vjournalString,true), //This property specifies non-processing information intended to provide a comment to the calendar user.			
			contact:this.getValue('CONTACT',vjournalString,true), //The property is used to represent contact information or alternately a reference to contact information associated with the calendar component.
			exdate:this.getValue('EXDATE',vjournalString,true), //This property defines the list of date/time exceptions for a recurring calendar component.
			exrule:this.getValue('EXRULE',vjournalString,true), //This property defines a rule or repeating pattern for an exception to a recurrence set.
			related:this.getValue('RELATED',vjournalString,true), //To specify the relationship of the alarm trigger with respect to the start or end of the calendar component.
			rdate:this.getValue('RDATE',vjournalString,true), //This property defines the list of date/times for a recurrence set.
			rrule:this.getValue('RRULE',vjournalString,true), //This property defines a rule or repeating pattern for recurring events, to-dos, or time zone definitions.
			rstatus:this.getValue('REQUEST-STATUS',vjournalString,true), //This property defines the status code returned for a scheduling request.			
			xprop:this.getValue('X-',vjournalString,true), //
		};
		this.ical.journals[this.ical.journals.length]=journal;
	},
	parseVtodo: function(vtodoString){
		////PROCHAINE VERSION: Générer seul les propriétés trouvées : + rapide
		var todo={
			class:this.getValue('CLASS',vtodoString), //This property defines the access classification for a calendar component.
			completed:this.getValue('COMPLETED',vtodoString), //This property defines the date and time that a to-do was actually completed.
			created:this.getValue('CREATED',vtodoString), //This property specifies the date and time that the calendar information was created by the calendar user agent in the calendar store.
			description:this.getValue('DESCRIPTION',vtodoString), //This property provides a more complete description of the calendar component, than that provided by the "SUMMARY" property.
			dtstamp:this.getValue('DTSTAMP',vtodoString), //The property indicates the date/time that the instance of the iCalendar object was created.
			geo:this.getValue('GEO',vtodoString), //This property specifies information related to the global position for the activity specified by a calendar component.
			lastmod:this.getValue('LAST-MODIFIED',vtodoString), //The property specifies the date and time that the information associated with the calendar component was last revised in the calendar store.
			location:this.getValue('LOCATION',vtodoString), //The property defines the intended venue for the activity defined by a calendar component.
			organizer:this.getValue('ORGANIZER',vtodoString), //The property defines the organizer for a calendar component.
			percent:this.getValue('PERCENT-COMPLETE',vtodoString), //This property is used by an assignee or delegatee of a to-do to convey the percent completion of a to-do to the Organizer.
			priority:this.getValue('PRIORITY',vtodoString), //The property defines the relative priority for a calendar component.
			recurid:this.getValue('RECURRENCE-ID',vtodoString), //This property is used in conjunction with the "UID" and "SEQUENCE" property to identify a specific instance of a recurring "VEVENT", "VTODO" or "VJOURNAL" calendar component. The property value is the effective value of the "DTSTART" property of the recurrence instance.
			seq:this.getValue('SEQUENCE',vtodoString), //This property defines the revision sequence number of the calendar component within a sequence of revisions.
			status:this.getValue('STATUS',vtodoString), //This property defines the overall status or confirmation for the calendar component.
			summary:this.getValue('SUMMARY',vtodoString), //This property defines a short summary or subject for the calendar component.
			uid:this.getValue('UID',vtodoString), //This property defines the persistent, globally unique identifier for the calendar component.
			url:this.getValue('URL',vtodoString), //This property defines a Uniform Resource Locator (URL) associated with the iCalendar object.

			due:this.getValue('DUE',vtodoString), //This property defines the date and time that a to-do is expected to be completed.
			duration:this.getValue('DURATION',vtodoString), //The property specifies a positive duration of time.

			attach:this.getValue('ATTACH',vtodoString,true), //The property provides the capability to associate a document object with a calendar component.
			attendee:this.getValue('ATTENDEE',vtodoString,true), //The property defines an "Attendee" within a calendar component.
			categories:this.getValue('CATEGORIES',vtodoString,true), //This property defines the categories for a calendar component.
			comment:this.getValue('COMMENT',vtodoString,true), //This property specifies non-processing information intended to provide a comment to the calendar user.			
			contact:this.getValue('CONTACT',vtodoString,true), //The property is used to represent contact information or alternately a reference to contact information associated with the calendar component.
			exdate:this.getValue('EXDATE',vtodoString,true), //This property defines the list of date/time exceptions for a recurring calendar component.
			exrule:this.getValue('EXRULE',vtodoString,true), //This property defines a rule or repeating pattern for an exception to a recurrence set.
			rstatus:this.getValue('REQUEST-STATUS',vtodoString,true), //This property defines the status code returned for a scheduling request.			
			related:this.getValue('RELATED',vtodoString,true), //To specify the relationship of the alarm trigger with respect to the start or end of the calendar component.
			resources:this.getValue('RESOURCES',vtodoString,true), //This property defines the equipment or resources anticipated for an activity specified by a calendar entity..
			rdate:this.getValue('RDATE',vtodoString,true), //This property defines the list of date/times for a recurrence set.
			rrule:this.getValue('RRULE',vtodoString,true), //This property defines a rule or repeating pattern for recurring events, to-dos, or time zone definitions.
			xprop:this.getValue('X-',vtodoString,true), //
		};
		this.ical.todos[this.ical.todos.length]=todo;
	},
	parseVevent: function(veventString){
		////PROCHAINE VERSION: Générer seul les propriétés trouvées : + rapide
		var event={
			class:this.getValue('CLASS',veventString), //This property defines the access classification for a calendar component.
			created:this.getValue('CREATED',veventString), //This property specifies the date and time that the calendar information was created by the calendar user agent in the calendar store.
			description:this.getValue('DESCRIPTION',veventString), //This property provides a more complete description of the calendar component, than that provided by the "SUMMARY" property.
			geo:this.getValue('GEO',veventString), //This property specifies information related to the global position for the activity specified by a calendar component.
			lastmod:this.getValue('LAST-MODIFIED',veventString), //The property specifies the date and time that the information associated with the calendar component was last revised in the calendar store.
			location:this.getValue('LOCATION',veventString), //The property defines the intended venue for the activity defined by a calendar component.
			organizer:this.getValue('ORGANIZER',veventString), //The property defines the organizer for a calendar component.
			priority:this.getValue('PRIORITY',veventString), //The property defines the relative priority for a calendar component.
			dtstamp:this.getValue('DTSTAMP',veventString), //The property indicates the date/time that the instance of the iCalendar object was created.
			seq:this.getValue('SEQUENCE',veventString), //This property defines the revision sequence number of the calendar component within a sequence of revisions.
			status:this.getValue('STATUS',veventString), //This property defines the overall status or confirmation for the calendar component.
			transp:this.getValue('TRANSP',veventString), //This property defines whether an event is transparent or not to busy time searches.
			url:this.getValue('URL',veventString), //This property defines a Uniform Resource Locator (URL) associated with the iCalendar object.
			recurid:this.getValue('RECURRENCE-ID',veventString), //This property is used in conjunction with the "UID" and "SEQUENCE" property to identify a specific instance of a recurring "VEVENT", "VTODO" or "VJOURNAL" calendar component. The property value is the effective value of the "DTSTART" property of the recurrence instance.
			duration:this.getValue('DURATION',veventString), //The property specifies a positive duration of time.
			attach:this.getValue('ATTACH',veventString,true), //The property provides the capability to associate a document object with a calendar component.
			attendee:this.getValue('ATTENDEE',veventString,true), //The property defines an "Attendee" within a calendar component.
			categories:this.getValue('CATEGORIES',veventString,true), //This property defines the categories for a calendar component.
			comment:this.getValue('COMMENT',veventString,true), //This property specifies non-processing information intended to provide a comment to the calendar user.			
			contact:this.getValue('CONTACT',veventString,true), //The property is used to represent contact information or alternately a reference to contact information associated with the calendar component.
			exdate:this.getValue('EXDATE',veventString,true), //This property defines the list of date/time exceptions for a recurring calendar component.
			exrule:this.getValue('EXRULE',veventString,true), //This property defines a rule or repeating pattern for an exception to a recurrence set.
			rstatus:this.getValue('REQUEST-STATUS',veventString,true), //This property defines the status code returned for a scheduling request.			
			related:this.getValue('RELATED',veventString,true), //To specify the relationship of the alarm trigger with respect to the start or end of the calendar component.
			resources:this.getValue('RESOURCES',veventString,true), //This property defines the equipment or resources anticipated for an activity specified by a calendar entity..
			rdate:this.getValue('RDATE',veventString,true), //This property defines the list of date/times for a recurrence set.
			rrule:this.getValue('RRULE',veventString,true), //This property defines a rule or repeating pattern for recurring events, to-dos, or time zone definitions.
			xprop:this.getValue('X-',veventString,true), //
			uid:this.getValue('UID',veventString), //This property defines the persistent, globally unique identifier for the calendar component.
			summary:this.getValue('SUMMARY',veventString), //This property defines a short summary or subject for the calendar component.
			dtstart:this.getValue('DTSTART',veventString), //This property specifies when the calendar component begins.
			dtend:this.getValue('DTEND',veventString) //This property specifies the date and time that a calendar component ends.
		};
		this.ical.events[this.ical.events.length]=event;
	},
	getValue: function(propName,txt,multiple){
		if(multiple){
			eval('var matches=txt.match(/\\n'+propName+'[^:]*/g)');
			var props=[];
			if(matches){
				for(l=0;l<matches.length;l++){
					//on enleve les parametres 
					matches[l]=matches[l].replace(/;.*/,'');
					props[props.length]=this.getValue(matches[l],txt);
				}
				return props;
			}
		}else{
			var reg=new RegExp('('+propName+')(;[^=]*=[^;:\n]*)*:([^\n]*)','g');
			var matches=reg.exec(txt);
			if(matches){ //on a trouvé la propriété cherchée
				var valeur=RegExp.$3;
				var tab_params;
				if(RegExp.$2.length>0){ //il y a des paramètres associés
					var params=RegExp.$2.substr(1).split(';');
					var pair;var code='';
					for(k=0;k<params.length;k++){
						pair=params[k].split('=');
						if(!pair[1]) pair[1]=pair[0];
						code+=pair[0].replace(/-/,'')+' : "'+pair[1]+'", '; 
					}
					eval('tab_params=( { '+code.substr(0,code.length-2)+' } );');
				}
				//console.log(propName+' '+valeur+'\n'+toJsonString(tab_params));
				return {
					value:valeur,
					params:tab_params
				};
			}else{
				return null;
			}
		}
	}
}
