/************** GLOBAL VARIABLES **************/

/**
 * Used by the "orbisEditor" JQuery extension (see below)
 */
var orbisEditorPoller;

/**
 * Used by the "coverThis" JQuery extension (see below)
 */
var coverCount = 0;

/**
 * Used to know if the page was switched properly and the server didn't shut down or throw an error
 * This takes care of the ajax error boxed when navigating quickly from page to page 
 */
var unloadedProperly = false;
	
/**
 * Standard options for a JQuery dialog.
 */
var dialogOpts = {
	resizable: false,
	draggable: true,
	modal: true,
	autoOpen: false,
	position: [40, 40]	};

/** 
 * This global variable stores the site's " BASE url" - e.g. "http://www.foo.com"
 * It is used when injecting CSS files with an absolute URL to prevent problems in IE6 & IE7.
 * (see "orbisApp.components" below) 
 *
 * FIXME: this variable should be a member of the orbisApp object itself.
 */
var BaseURL = window.location.protocol + "//" + window.location.hostname;

/**
 * the following 2 variables are used within the orbis message system
 */
var orbisMessageBoxTimeout;
var orbisMessageBoxQueue = new Array();

/**
 * keyCodes are numbers that represent of keyboard keys
 */

var keyCodes = {
	pageup		: 33,
	pagedown	: 34,
	end			: 35,
	home		: 36,

	left		: 37,
	up			: 38,
	right		: 39,
	down		: 40
};

/************** GLOBAL JQUERY DOC-READY BLOCK **************
 * This is a global "document ready" block that applies 
 * various global behaviours to the entire site.
 */

$.widget("ui.dialog", $.extend({}, $.ui.dialog.prototype, {
    _title: function(title) {
        if (!this.options.title ) {
            title.html("&#160;");
        } else {
            title.html(this.options.title);
        }
    }
}));

$(document).ready(function() {

    $.ajaxSettings.traditional = true;

	orbisApp.hideSuccessMsg();
	orbisApp.hideWarningMsg();
	orbisApp.renderNotePopups();
	orbisApp.renderButtons();
	orbisApp.setTextareaLimit();
	orbisApp.renderBlinkTags();
	orbisApp.placeholderFix();

	$("form").on("submit",function(event){
		if ($.isEmptyObject(CKEDITOR.instances) == false)
		{
			for(var i in CKEDITOR.instances) CKEDITOR.instances[i].updateElement();
		}
	});
	
	$(window).bind("beforeunload", function(){
		unloadedProperly = true;
	});
	
	$(document).keyup(function(e){
		if (e.which == 27)
		{
			$('.is--visible').toggleClass('is--visible');
		}
	});

	$(".altStripe tr:even").css("background-color", "#E0E0E0");
	$(".altStripe tr:odd").css("background-color", "#EAEAEA");
	
	$("li.dropdown,li.dropdown-submenu").on('mouseenter mouseleave', function (e) {
	    var dropMenuElement = $(this).children("ul");
	    dropMenuElement.css({"left": "", "right": ""});
	 	var off = dropMenuElement.offset();
	    var l = off.left;
	    var w = dropMenuElement.width();
	    var docW = (window.innerWidth) ? window.innerWidth : document.documentElement.clientWidth||document.body.clientWidth||0;
	    var isEntirelyVisible = (l + w <= docW && l >= 0);

	    if (!isEntirelyVisible) {
	        if (l < 0)
	        {
	            dropMenuElement.css("left", -l + "px");
	        }
	        else
	        {
	        	var leftOffset = docW - w - l;
	            dropMenuElement.css("left", leftOffset + "px");
	            l = dropMenuElement.offset().left;
	            if (l < 0)
	            {
	            	dropMenuElement.css("left", (leftOffset - l) + "px");
	           	}
	        }
	        dropMenuElement.css("right", "auto");
        }
    });
});

$(window).on('load', function(){
	orbisApp.applyTabsBehaviour();
});

var test = false;
/************** GLOBAL OBJECT: orbisApp **************
 * "orbisApp" is a global object that holds various 
 * utility methods that are used throughout the site.
 */
var orbisApp = {

	/**
	 * "addComponent" function is called by the JSP to dynamically 
	 * inject a component from "this.components" in the the <head>
	 */
	addComponent : function(component) {
		var c = this.components[component];
		
		if (c)
		{
			if (c.loaded === false)
			{
				if(c.dependencies)
				{
					for(var i = 0; i < c.dependencies.length; i++)
					{
						this.addComponent(c.dependencies[i]);				
					}
				}			
				
				$("head").append(c.tag);			
				c.loaded = true;
			}
		}
		else
		{
			this.alertDialog("Error -> orbisApp.addComponent() -> Component '" + component + "' is undefined.", true, 300);
		}
	},

	/**
	 * This is the global map of all the available "components" that a JSP can choose from. 
	 */
	components : {
		
		jqGrid : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery.jqGrid-4.5.4/js/jquery.jqGrid.min-224.js'></script>",
			dependencies : ["jqGrid_css", "jqGrid_locale", "jqGrid_multiselect", "json", "OrbisGrid"],
			loaded : false
		},
		
		jqGrid_css : {
			tag : "<link type='text/css' rel='stylesheet' href='" + BaseURL + "/core/scripts/jquery/jquery.jqGrid-4.5.4/css/ui.jqgrid-224.css' />",
			loaded : false
		},

		jqGrid_locale : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery.jqGrid-4.5.4/js/i18n/grid.locale-"+orbisLocale+"-224.js'></script>",
			loaded : false
		},
		
		jqGrid_multiselect : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery.jqGrid-4.5.4/plugins/ui.multiselect-224.js'></script>",
			dependencies : ["multiselect_css"],
			loaded : false
		},
		
		multiselect_css : {
			tag : "<link type='text/css' rel='stylesheet' href='" + BaseURL + "/core/scripts/jquery/jquery.jqGrid-4.5.4/plugins/ui.multiselect-224.css' />",
			loaded : false
		},
		
		json : {
			tag : "<script type='text/javascript' src='/core/scripts/json/json2-224.js'></script>",
			loaded : false
		},

		OrbisGrid : {
			tag : "<script type='text/javascript' src='/core/scripts/orbis/orbisGrid/OrbisGrid-224.js'></script>",
			loaded : false
		},
		
		form : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery.form-2.43/jquery.form-224.js'></script>",
			loaded : false
		},
		
		calendar : {
			tag : "<script type='text/javascript' src='/core/scripts/calendar/calendar-setup-224.js'></script>",
			dependencies : ["calendar_css", "calendar_js", "calendar_en"],
			loaded : false
		},
		
		calendar_js : {
			tag : "<script type='text/javascript' src='/core/scripts/calendar/calendar-224.js'></script>",
			loaded : false
		},

		calendar_css : {
			tag : "<link type='text/css' rel='stylesheet' href='" + BaseURL + "/core/scripts/calendar/calendar-blue-224.css' />",
			loaded : false
		},
		
		calendar_en : {
			tag : "<script type='text/javascript' src='/core/scripts/calendar/lang/calendar-en-224.js'></script>",
			loaded : false
		},
		
		/**
		 * Note: JQuery Validate must be imported before the additional methods.
		 */
		jqueryValidate : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery-validation-1.11.1/additional-methods.min-224.js'></script>",
			dependencies : ["jqueryValidate_css", "jqueryValidateJS", "jqueryValidateOrbisSettings", "jqueryValidate_locale"],
			loaded : false
		},
		
		jqueryValidateJS : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery-validation-1.11.1/jquery.validate.min-224.js'></script>",
			loaded : false
		},
		
		jqueryValidateOrbisSettings : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery-validation-1.11.1/orbisValidateSettings-224.js'></script>",
			loaded : false
		},		
		
		jqueryValidate_locale : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery-validation-1.11.1/localization/messages_"+orbisLocale+"-224.js'></script>",
			loaded : false
		},

		jqueryValidate_css : {
			tag : "<link type='text/css' rel='stylesheet' href='" + BaseURL + "/core/css/jquery-validate-225.css' />",
			loaded : false
		},
		
		jqueryTooltip : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery-tooltip-1.3/jquery.tooltip.min-224.js'></script>",
			dependencies : ["bgiframe", "delegate", "dimentions"],
			loaded : false
		},
		
		bgiframe : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery-tooltip-1.3/lib/jquery.bgiframe-224.js'></script>",
			loaded : false
		},
		
		delegate : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery-tooltip-1.3/lib/jquery.delegate-224.js'></script>",
			loaded : false
		},
		
		dimentions : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery-tooltip-1.3/lib/jquery.dimensions-224.js'></script>",
			loaded : false
		},
		
		tooltip : {
			tag : "<script type='text/javascript' src='/core/scripts/tooltip/form-field-tooltip-224.js'></script>",
			loaded : false
		},
		
		tooltipCorners : {
			tag : "<script type='text/javascript' src='/core/scripts/tooltip/rounded-corners-224.js'></script>",
			loaded : false
		},
		
		tooltip_css : {
			tag : "<link type='text/css' rel='stylesheet' href='" + BaseURL + "/core/css/tooltip/form-field-tooltip-224.css' />",
			loaded : false
		},
		
		md5 : {
			tag : "<script type='text/javascript' src='/core/scripts/md5-224.js'></script>",
			loaded : false
		},
		
		keepAlive : {
			tag : "<script type='text/javascript' src='/core/scripts/orbis/keepAlive-224.js'></script>",
			loaded : false
		},
		
		zrssfeed : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/zrssfeed-101/jquery.zrssfeed.min-224.js'></script>",
			loaded : false
		},	
		
		tree : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery-wdTree/src/Plugins/jquery.tree.modified-224.js'></script>",
			dependencies : ["tree_css", "treeTools"],
			loaded : false
		},
		
		tree_css : {
			tag : "<link type='text/css' rel='stylesheet' href='" + BaseURL + "/core/scripts/jquery/jquery-wdTree/css/tree-224.css' />",
			loaded : false
		},
		
		treeTools : {
			tag : "<script type='text/javascript' src='/core/scripts/orbis/treeTools/treeTools-224.js'></script>",
			loaded : false
		},
		
		dragscrollable : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery.dragscrollable-1.0/dragscrollable-224.js'></script>",
			loaded : false 
		},
		
		colorPicker : {
			tag : "<script type='text/javascript'src='/core/scripts/jquery/jquery-colorpicker-1.4/colorpicker-224.js'></script>",
			dependencies : ["colorPicker_css", "colorPicker_layoutCss"],
			loaded : false
		},
		
		colorPicker_css : {
			tag : "<link rel='stylesheet' href='" + BaseURL + "/core/scripts/jquery/jquery-colorpicker-1.4/css/colorpicker-224.css' type='text/css' />",			
			loaded : false
		},
		
		colorPicker_layoutCss : {
			tag : "<link rel='stylesheet' media='screen' type='text/css' href='" + BaseURL + "/core/scripts/jquery/jquery-colorpicker-1.4/css/layout-224.css' />",
			loaded : false
		},
		
		hoverIntent : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery.hoverIntent-r5/jquery.hoverIntent.minified-224.js'></script>",
			loaded : false
		},
		
		lightbox : {
			tag : '<script type="text/javascript" src="/core/scripts/jquery/jquery-lightbox-0.5/js/jquery.lightbox-0.5.pack.js"></script>',
			dependencies : ["lightbox_css"],
			loaded : false
		},
		
		lightbox_css : {
			tag : '<link rel="stylesheet" type="text/css" href="' + BaseURL + '/core/scripts/jquery/jquery-lightbox-0.5/css/jquery.lightbox-0.5.css" media="screen" />',
			loaded : false
		},
		
		uploadify : {
			tag : '<script type="text/javascript" src="/core/scripts/jquery/jquery.uploadify-2.0.3/jquery.uploadify.v2.0.3.ForOch.min.js"></script>',
			dependencies : ["uploadify_css", "swfobject"],
			loaded : false
		},
		
		uploadify_css : {
			tag : '<link href="' + BaseURL + '/core/scripts/jquery/jquery.uploadify-2.0.3/css/style-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		swfobject : {
			tag : '<script type="text/javascript" src="/core/scripts/swfobject_2_2.js"></script>',
			loaded : false
		},
	
		youtubin : {
			tag : '<script type="text/javascript" src="/core/scripts/jquery/jquery.youtubin-1.2/jquery.youtubin-224.js"></script>',
			dependencies : ["swfobject"],
			loaded : false
		},

		simpleviewer : {
			tag : '<script type="text/javascript" src="/core/scripts/simpleviewer_pro_210/js/simpleviewer-224.js"></script>',
			dependencies : ["swfobject"],
			loaded : false
		},
		
		orbisSlideshow : {
			tag : '<script type="text/javascript" src="/core/scripts/orbis/orbisSlideshow/orbisSlideshow-2-224.js"></script>',
			dependencies : ["orbisSlideshow_css"],
			loaded : false
		},
		
		orbisSlideshow_css : {
			tag : '<link href="' + BaseURL + '/core/scripts/orbis/orbisSlideshow/orbisSlideshow-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		orbisSlider : {
			tag : '<script type="text/javascript" src="/core/scripts/orbis/orbisSlider/orbisSlider-224.js"></script>',
			dependencies : ["orbisSlider_css"],
			loaded : false
		},
		
		orbisSlider_css : {
			tag : '<link href="' + BaseURL + '/core/scripts/orbis/orbisSlideshow/orbisSlider-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},

		orbisChat : {
			tag : '<script type="text/javascript" src="/core/scripts/orbis/orbisChat/orbisChat-224.js"></script>',
			dependencies : ["orbisChat_css"],
			loaded : false
		},
		
		orbisChat_css : {
			tag : '<link href="' + BaseURL + '/core/scripts/orbis/orbisChat/orbisChat-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		orbisRatingWidget : {
			tag : '<script type="text/javascript" src="/core/scripts/orbis/orbisRating/ratingWidget-224.js"></script>',
			dependencies : ["orbisRatingWidget_css"],
			loaded : false
		},
		
		orbisRatingWidget_css : {
			tag : '<link href="' + BaseURL + '/core/scripts/orbis/orbisRating/ratingWidget-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		scrollTo : {
			tag : '<script type="text/javascript" src="/core/scripts/jquery/jquery.scrollTo/jquery.scrollTo-1.4.3.1-min.js"></script>',
			loaded : false
		},
		
		printElement : {
			tag : '<script type="text/javascript" src="/core/scripts/jquery/jquery.printElement-1.2/jquery.printElement.min-224.js"></script>',
			loaded : false
		},
		
		printThis : {
			tag : '<script type="text/javascript" src="/core/scripts/jquery/jquery.printThis/jquery.printThis-224.js"></script>',
			loaded : false
		},
				
		getStyles : {
			tag : '<script type="text/javascript" src="/core/scripts/jquery/jquery.getStyles/jquery.getStyleObject-224.js"></script>', 
			loaded : false
		},
		
		orbisDropdown : {
			tag : '<script type="text/javascript" src="/core/scripts/orbis/orbisDropdown/orbisDropdown-224.js"></script>',
			dependencies : ["orbisDropdown_css"],
			loaded : false
		},
		
		orbisDropdown_css : {
			tag : '<link href="' + BaseURL + '/core/scripts/orbis/orbisDropdown/orbisDropdown-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		jqueryTools : {
			tag : '<script type="text/javascript" src="/core/scripts/jquery/jquery-tools-1.2.7/jquery.tools.min-224.js"></script>',
			loaded : false
		},

		highCharts : {
			tag : '<script type="text/javascript" src="/core/scripts/jquery/jquery.highcharts-4.1.8/js/highcharts-228.js"></script> <script type="text/javascript" src="/core/scripts/jquery/jquery.highcharts-4.1.8/js/highcharts-more-228.js"/> <script type="text/javascript" src="/core/scripts/jquery/jquery.highcharts-4.1.8/js/highcharts-3d-228.js"/> <script type="text/javascript" src="/core/scripts/jquery/jquery.highcharts-4.1.8/js/modules/exporting-228.js"/>',
			loaded : false
		},
		
		orbisLimitMaxChar: {
			tag : '<script type="text/javascript" src="/core/scripts/orbis/orbisInput/orbisLimitMaxChar-224.js"></script>',
			loaded : false
		},
		
		orbisLimitMaxCharDefault: {
			tag : '<script type="text/javascript" src="/core/scripts/orbis/orbisInput/orbisLimitMaxCharDefault-224.js"></script>',
			loaded : false
		},
		
		jqueryCluetip : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery-cluetip/jquery.cluetip.min-224.js'></script>",
			dependencies : ["bgiframe", "jqueryCluetip_css", "hoverIntent_r6"],
			loaded : false
		},
		
		jqueryCluetip_css : {
			tag : '<link href="' + BaseURL + '/core/scripts/jquery/jquery-cluetip/jquery.cluetip-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		hoverIntent_r6 : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery.hoverIntent-r6/jquery.hoverIntent.minified-224.js'></script>",
			loaded : false
		},
		
		userDetailPreferences : {
			tag : "<script type='text/javascript' src='/core/scripts/orbis/userDetailPreferences/userDetailPreferences-224.js'></script>",
			dependencies : ["userDetailPreferences_css"],
			loaded : false
		},
		
		userDetailPreferences_css : {
			tag : '<link href="' + BaseURL + '/core/css/userDetailPreferences/userDetailPreferences-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		jqueryEasingGsgd : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery-easing-gsgd/jquery.easing.1.3.js'></script>",
			loaded : false
		},
		
		tweet : {
			tag : "<script type='text/javascript' src='/core/scripts/twitter/jquery.tweet-224.js'></script>",
			dependencies : ["tweet_css"],
			loaded : false
		},
		
		tweet_css : {
			tag : '<link href="' + BaseURL + '/core/scripts/twitter/jquery.tweet-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		agilityjs : {
			tag : "<script type='text/javascript' src='/core/scripts/jquery/jquery.agility-0.1.2/agility.min-224.js'></script>",
			loaded : false
		},
		
		fullCalendar : {
			tag: "<script type='text/javascript' src='/core/scripts/jquery/jquery.fullCalendar-1.6.1/fullcalendar.min-224.js'></script>",
			dependencies : ["fullCalendar_css"],
			loaded : false
		},
		
		fullCalendar_css : {
			tag : '<link href="' + BaseURL + '/core/scripts/jquery/jquery.fullCalendar-1.6.1/fullcalendar-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},

		fullCalendar_orbisAgendaMod : {
			tag: "<script type='text/javascript' src='/core/scripts/jquery/jquery.fullCalendar-1.6.1-orbisAgendaMod/fullcalendar.min-224.js'></script>",
			dependencies : ["fullCalendar_css_orbisAgendaMod", "json"],
			loaded : false
		},
		
		fullCalendar_css_orbisAgendaMod : {
			tag : '<link href="' + BaseURL + '/core/scripts/jquery/jquery.fullCalendar-1.6.1-orbisAgendaMod/fullcalendar-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		noDoubleTapZoom : {
			tag: "<script type='text/javascript' src='/core/scripts/jquery/jquery.mobileTouchOptions/mobileOptions-224.js'></script>",
			loaded : false
		},
		
		jquery_hotkeys : {
			tag: "<script type='text/javascript' src='/core/scripts/jquery/jquery.hotkeys/jquery.hotkeys-224.js'></script>",
			loaded : false
		},
		
		jquery_timePickerAddon : {
			tag: "<script type='text/javascript' src='/core/scripts/jquery/jquery-Timepicker-Addon/jquery-ui-timepicker-addon-224.js'></script>",
			dependencies : ["jquery_timePickerAddon_css"],
			loaded : false
		},
		
		jquery_timePickerAddon_en : {
			tag: "<script type='text/javascript' src='/core/scripts/jquery/jquery-Timepicker-Addon/localization/jquery-ui-timepicker-en-224.js'></script>",
			dependencies : ["jquery_timePickerAddon"],
			loaded : false
		},

		jquery_timePickerAddon_fr : {
			tag: "<script type='text/javascript' src='/core/scripts/jquery/jquery-Timepicker-Addon/localization/jquery-ui-timepicker-fr-1-224.js'></script>",
			dependencies : ["jquery_datePicker_fr", "jquery_timePickerAddon"],
			loaded : false
		},

		jquery_timePickerAddon_css : {
			tag : '<link href="' + BaseURL + '/core/scripts/jquery/jquery-Timepicker-Addon/jquery-ui-timepicker-addon-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		chosen : {
			tag : "<script type='text/javascript' src='" + BaseURL + "/core/chosen/chosen.jquery.min-224.js'></script>",
			dependencies : ["chosen_css"],
			loaded : false
		},
		
		chosen_css : {
			tag : '<link href="' + BaseURL + '/core/chosen/chosen-225.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		ajax_chosen : {
			tag : "<script type='text/javascript' src='" + BaseURL + "/core/chosen/ajax.chosen-224.js'></script>",
			dependencies : ["chosen"],
			loaded : false
		},

		date_format : {
			tag: "<script type='text/javascript' src='/core/scripts/dateFormat/date.format-224.js'></script>",
			loaded : false
		},
		
		markdown : {
			tag: "<script type='text/javascript' src='/core/scripts/markdown/markdown-224.js'></script>",
			loaded : false
		},
		
		jquery_datePicker_fr : {
			tag: "<script type='text/javascript' src='/core/scripts/jquery/jquery-ui-1.10.2.custom/js/jquery.ui.datepicker-fr-224.js'></script>",
			loaded : false
		},

		dropdownMultiselect : {
			tag: "<script type='text/javascript' src='/core/scripts/jquery/jquery.multiselect-1.13/src/jquery.multiselect.min-224.js'></script>",
			dependencies : ["dropdownMultiselect_filter", "dropdownMultiselect_css",],
			loaded : false
		}, 
		
		dropdownMultiselect_filter : {
			tag: "<script type='text/javascript' src='/core/scripts/jquery/jquery.multiselect-1.13/src/jquery.multiselect.filter.min-224.js'></script>",
			dependencies : ["dropdownMultiselect_filter_css"],
			loaded : false
		}, 

		dropdownMultiselect_css : {
			tag : '<link href="' + BaseURL + '/core/scripts/jquery/jquery.multiselect-1.13/jquery.multiselect-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		dropdownMultiselect_filter_css : {
			tag : '<link href="' + BaseURL + '/core/scripts/jquery/jquery.multiselect-1.13/jquery.multiselect.filter-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		accounting : {
			tag: "<script type='text/javascript' src='/core/scripts/accounting/accounting.min-224.js'></script>",
			loaded : false
		},
		
		blockUI : {
			tag: "<script type='text/javascript' src='/core/scripts/jquery/jquery-blockUI-2.57/jquery.blockUI-224.js'></script>",
			loaded : false
		},
		
		tableSorter : {
			tag: "<script type='text/javascript' src='/core/scripts/jquery/jquery.tablesorter-2.10.8/js/jquery.tablesorter.min-224.js'></script>",
			dependencies: ["tableSorter_css"],
			loaded : false
		},

		tableSorter_css : {
			tag : '<link href="' + BaseURL + '/core/scripts/jquery/jquery.tablesorter-2.10.8/css/theme.default-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		dateTimePicker : {
			tag: "<script type='text/javascript' src='/core/bootstrap/plugins/bootstrap-datetimepicker-0.0.11/bootstrap-datetimepicker.min-224.js'></script>",
			dependencies: ["dateTimePicker_css", "dateTimePicker_orbisTools", "dateTimePicker_orbisStyles"],
			loaded : false
		},

		dateTimePicker_css : {
			tag : '<link href="' + BaseURL + '/core/bootstrap/plugins/bootstrap-datetimepicker-0.0.11/bootstrap-datetimepicker.min-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		dateTimePicker_orbisTools : {
			tag: "<script type='text/javascript' src='/core/bootstrap/plugins/bootstrap-datetimepicker-0.0.11/dateTimePicker_orbisTools-225.js'></script>",
			loaded : false
		},
		
		dateTimePicker_orbisStyles : {
			tag : '<link href="' + BaseURL + '/core/bootstrap/plugins/bootstrap-datetimepicker-0.0.11/dateTimePicker_orbisStyles-224.css" rel="stylesheet" type="text/css" />',
			loaded : false
		},
		
		nested_sortable : {
			tag: "<script type='text/javascript' src='/core/scripts/jquery/jquery.mjs.nestedSortable/jquery.mjs.nestedSortable.js'></script>",
			loaded : false
		},
		
		momentjs : {
			tag: "<script type='text/javascript' src='/core/scripts/moment/moment.min-224.js'></script>",
			loaded : false
		},

		lodash : {
			tag: "<script type='text/javascript' src='/core/scripts/lodash.js'></script>",
			loaded : false
		},
		
		vuejs : {
			tag: "<script type='text/javascript' src='/core/scripts/vue.min.js'></script>",
			loaded : false
		},
		
		sortable : {
			tag: "<script type='text/javascript' src='/core/scripts/Sortable.min.js'></script>",
			loaded : false
		}
		
	},
	
	/** 
	 * "hideSuccessMsg" automatically hides "successMsgFadeout" div's after 5 seconds
	 */
	hideSuccessMsg : function() {
		$(".successMsgFadeout:visible").stepDelay(5000, function() {$(this).fadeOut("slow");});
	},
	
	/** 
	 * "hideWarningMsg" automatically hides "warningMsgFadeout" div's after 5 seconds
	 */
	hideWarningMsg : function() {
		$(".warningMsgFadeout:visible").stepDelay(5000, function() {$(this).fadeOut("slow");});
	},

	/**
	 * Automatically collapses tabs onto one row given the parent's Id
	 */
	startTabLogic : function(tabGroupId) {
		var extraTabHtml = '<li class="dropdown"><a class="dropdown-toggle" data-toggle="dropdown" href="#">...</a><ul class="dropdown-menu" ></ul></li>';
		$("#" + tabGroupId).append(extraTabHtml);
		
		$(window).on("resize", function() {
			orbisApp.tabLogic("#" + tabGroupId);
		});
		
		$("#" + tabGroupId + ">li:last-child").on('mouseenter mouseleave', function (e) {
		    var dropMenuElement = $("ul.dropdown-menu", this);
		    dropMenuElement.css({"left": "", "right": ""});
		 	var off = dropMenuElement.offset();
		    var l = off.left;
		    var w = dropMenuElement.width();
		    var docW = (window.innerWidth) ? window.innerWidth : document.documentElement.clientWidth||document.body.clientWidth||0;
		    var isEntirelyVisible = (l + w <= docW && l >= 0);

		    if (!isEntirelyVisible) {
		        if (l < 0)
		        {
		            dropMenuElement.css("left", -l + "px");
		        }
		        else
		        {
		        	var leftOffset = docW - w - l;
		            dropMenuElement.css("left", leftOffset + "px");
		            l = dropMenuElement.offset().left;
		            if (l < 0)
		            {
		            	dropMenuElement.css("left", (leftOffset - l) + "px");
		           	}
		        }
		        dropMenuElement.css("right", "auto");
	        }
	    });
		
		orbisApp.tabLogic("#" + tabGroupId);
	},
	
	tabLogic : function(tabGroupSelector) {
		orbisApp.autoexpand(tabGroupSelector);
		orbisApp.autocollapse(tabGroupSelector);
		
		var extraTab = $(tabGroupSelector + ">li:last-child");
		var collapsed = extraTab.children(":last-child");
		
		if (!extraTab.hasClass('hide') && collapsed.children().size() == 0)
		{
			extraTab.hide();
			extraTab.removeClass('active');
		}
		if (collapsed.children().size() > 0 || $(tabGroupSelector).innerHeight() >= 50)
		{
			extraTab.show();
			var tabsHeight = $(tabGroupSelector).innerHeight();
			var tabs = $(tabGroupSelector + '>li:not(:last-child)');
			
			if (tabsHeight >= 50 && tabs.size() > 1)
			{
				tabs.last().prependTo(collapsed);
			}
			if (collapsed.children("li.active").size() > 0)
			{
				extraTab.addClass('active');
			}
			else
			{
				extraTab.removeClass('active');
			}
		}
	},
	
	autoexpand : function(tabGroupSelector) {
		var tabsHeight = $(tabGroupSelector).innerHeight();
		var extraTab = $(tabGroupSelector + ">li:last-child");
		var tabs = extraTab.children(":last-child").children();
		if (tabsHeight < 50 && tabs.size() > 0)
		{
			tabs.first().insertBefore(extraTab);
			orbisApp.autoexpand(tabGroupSelector);
		}
	},
	
	autocollapse : function(tabGroupSelector) {
		var tabsHeight = $(tabGroupSelector).innerHeight();
		var tabs = $(tabGroupSelector + '>li:not(:last-child)');
		if (tabsHeight >= 50 && tabs.size() > 1)
		{
			var collapsed = $(tabGroupSelector + ">li:last-child>:last-child");
			tabs.last().prependTo(collapsed);
			orbisApp.autocollapse(tabGroupSelector);
		}
	},
	
	/** 
	 * Note system
	 * Create a span with class="notePopup" around the note text where you want the link to be
	 * set the span style="display:none;" <- This fixes a minor glitch where the popup text would display before being replaced by 'Note'
	 * To edit the link style use the class ".noteLink"
	 */
	renderNotePopups : function() {
		var noteDialogNum = 0;
		$("span.notePopup:not(.rendered)").each(function(){
			var noteText = $(this).html();
			var noteTitle = $(this).attr("noteTitle");
			var dialogId = "note"+noteDialogNum;
			
			var $titleImage = $(document.createElement("img")).attr({
				src : "/core/images/icons/help-16x16.png",
				alt : i18n.s55118689,
				title : i18n.s55118689
			}).css({
				"margin-right" : "5px"
			});
			
			var $setTitle = $(document.createElement("span")).html(noteTitle).prepend($titleImage);
			var dialogWidth = $.isNumeric($(this).attr("dialogWidth")) ? $(this).attr("dialogWidth") : 400;
			var dialogConf = {};
			if ($(this).attr("showPrintBtn") === "true")
			{
				orbisApp.addComponent("printElement");
				dialogConf = {"Print": function(){$("div.noteText", "#"+dialogId).printElement({pageTitle:noteTitle});}};
			}
			
			var $dialogDiv = $(document.createElement("div")).addClass("notePopupClass").attr({
				title : $setTitle.html(),
				id : dialogId
			}).css({
				display: "none",
				width : "100%"
			});
			
			var $dialogContent = $(document.createElement("div")).addClass("noteText").html(noteText);

			$("body").prepend($dialogDiv.html($dialogContent));		
			orbisApp.setUpRegularDialog("#"+dialogId, dialogConf, {width: dialogWidth});
			
			var $noteAnchor = $(document.createElement("a")).addClass("noteLink").attr("href", "javascript:void(0);").click(function(){
				$("#" + dialogId).modal("show");
			});

			var $noteAnchorImage = $(document.createElement("img")).attr({
				src : "/core/images/icons/help-16x16.png",
				alt : i18n.s55118689,
				title : i18n.s55118689
			}).css({
				width : "14px",
				height : "14px",
				"margin-left" : "5px"
			});

			$(this).html($noteAnchor.html($noteAnchorImage));
			$(this).css({display:"inline"}).addClass("rendered");
			$(".noteText").css({"font-size":11, "line-height":1});

			noteDialogNum++;
		});		
	},
	
	/** 
	 * Button system
	 *
	 * Create a div with a class of "largeTestButton", "mediumTestButton" or "smallTestButton" with a form followed by text
	 * The form does not require the method or the Id attributes, they will be set within this function.
	 * 
	 * For buttons to execute local functions, add the attributes callback(function name OR inline function)
	 * Note: args MUST be a delimited string sepparated by commas(,) and the function will receive a String[]
	 *
	 * To make buttons go to some URL, do something like this...
	 * <div class="mediumTestButton"><a href="http://www.website.com?foo=bar">Click Me</a></div>
	 *
	 * Button Note: to override any of the css styles, apply the style to the button div with the !important attribute
	 * eg: <div class="largeTestButton" style="width: 100px !important"><form><input ...></form>Button Text</div>
	 */
	renderButtons : function() {

		$(".largeTestButton[buttonRendered!='true']").each(function(){
			var style = new Object();
			style.width = "98%";
			
			$(this).addClass("btn btn-large");
			orbisApp.setupButtons(this, style);
		});
		$(".mediumTestButton[buttonRendered!='true']").each(function(){
			var style = new Object();
			style.width = "98%";
			
			$(this).addClass("btn btn-medium");
			orbisApp.setupButtons(this, style);
		});
		$(".smallTestButton[buttonRendered!='true']").each(function(){
			var style = new Object();
			style.width = "98%";
			
			$(this).addClass("btn btn-small");
			orbisApp.setupButtons(this, style);
		});
		$(".orbisLink[buttonRendered!='true']").each(function(){
			var style = new Object();
			style.width = "98%";
			style.margin = "1px";
			orbisApp.setupButtons(this, style);
		});
	},

	/**
	 * "orbisApp.checkAjaxResponse" is a utility method that can be used for 
	 * checking an ajax response for error conditions.  If such a 
	 * condition is detected then this method will perform the 
	 * appropriate UI behaviour, and also return FALSE which the 
	 * caller can use to stop normal application flow.
	 *
	 * @param xmlHttpRequest<XmlHttpRequest> - the ajax-object used to perform the ajax request.
	 * @return <boolean> - FALSE if there was a problem, otherwise TRUE
	 */
	checkAjaxResponse : function (xmlHttpRequest)
	{
		var happy = true;
		
		if (this.isEmpty(xmlHttpRequest))
		{
			happy = false;
			this.displayErrorMessage(i18n.c53266207);
		}
		else
		{
			if (!this.isEmpty(xmlHttpRequest.getResponseHeader("notLoggedIn")))
			{
				happy = false;
			    window.parent.location = "/notLoggedIn.htm";
			}
			else if (!this.isEmpty(xmlHttpRequest.getResponseHeader("portalError")))
			{
				happy = false;
			    window.parent.location = "/portalError.htm";
			}
			else if (this.isEmpty(xmlHttpRequest.status))
			{
				if(!unloadedProperly)
				{
					happy = false;
					this.displayErrorMessage(i18n.g92510331);
				}
			}
			else if (xmlHttpRequest.status != 200)
			{
				happy = false;
				this.displayErrorMessage(i18n.x410443028);
			}
		}
		
		return happy;
	},

	/**
	 * "orbisApp.isHappyAjaxResponse" is a utility method that can be used for 
	 * checking an ajax response for error conditions.  If such a 
	 * condition is detected then this method will return FALSE.
	 *
	 * @param xmlHttpRequest<XmlHttpRequest> - the ajax-object used to perform the ajax request.
	 * @return <boolean> - FALSE if there was a problem, otherwise TRUE
	 */
	isHappyAjaxResponse : function (xmlHttpRequest)
	{
		var happy = true;
		
		if (this.isEmpty(xmlHttpRequest))
		{
			happy = false;
		}
		else
		{
			if (!this.isEmpty(xmlHttpRequest.getResponseHeader("notLoggedIn")))
			{
				happy = false;
			}
			else if (!this.isEmpty(xmlHttpRequest.getResponseHeader("portalError")))
			{
				happy = false;
			}
			else if (this.isEmpty(xmlHttpRequest.status))
			{
				if(!unloadedProperly)
				{
					happy = false;
				}
			}
			else if (xmlHttpRequest.status != 200)
			{
				happy = false;
			}
		}
		
		return happy;
	},

	/**
	 * Returns TRUE if s is a "valid email address", otherwise returns FALSE
	 */
	isValidEmail : function (s)
	{
	   return !this.isEmpty(s) && s.indexOf(" ") < 0 && (s.indexOf(".") > 2) && (s.indexOf("@") > 0);
	},
	
	isArray : function (obj)
	{
		return !this.isEmpty(obj) && !this.isEmpty(obj.length);
	},
	
	/**
	 * Returns TRUE if obj is "empty", otherwise returns FALSE
	 */
	isEmpty : function (obj)
	{
		var empty = false;
		
		if (typeof obj == "undefined" || obj == null || obj == "")
		{
			empty = true;
		}
		
		return empty;
	},
	
	/**
	 * Returns the specified "str" without the left or right
	 * "chars".
	 */
	trim : function (str, chars) {
		return this.ltrim(this.rtrim(str, chars), chars);
	},
	 
	/**
	 * Returns the specified "str" without the left "chars".
	 */
	ltrim : function (str, chars) {
		chars = chars || "\\s";
		return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
	},
	 
	/**
	 * Returns the specified "str" without the right "chars".
	 */
	rtrim : function (str, chars) {
		chars = chars || "\\s";
		return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
	},
	
	/*********** FULLCALENDAR STUFF **************/
	getDefaultFullCalendarOpts : function(locale)
	{
		if ("fr" == locale)
		{
			return this.defaultFullCalendarOptsFR;
		}
		else
		{
			return this.defaultFullCalendarOptsEN;
		}
	},
	
	defaultFullCalendarOptsEN : {
		lazyFetching: false,
		timeFormat: {agenda: 'h:mm TT{ - h:mm TT}'},
		columnFormat:{month:"ddd",week:"ddd M/d",day:"dddd M/d"},
		titleFormat:{month:"MMMM yyyy",week:"MMM d[ yyyy]{ '&#8212;'[ MMM] d yyyy}",day:"dddd, MMM d, yyyy"},
		buttonText:{prev:"&nbsp;&#9668;&nbsp;",next:"&nbsp;&#9658;&nbsp;",prevYear:"&nbsp;&lt;&lt;&nbsp;",nextYear:"&nbsp;&gt;&gt;&nbsp;",today:"today",month:"month",week:"week",day:"day"},
		monthNames:["January","February","March","April","May","June","July","August","September","October","November","December"],
		monthNamesShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
		dayNames:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
		dayNamesShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
		weekNumberTitle:"W"
	},
	
	defaultFullCalendarOptsFR : {
		lazyFetching: false,
		timeFormat: {agenda: 'h:mm TT{ - h:mm TT}'},
		columnFormat:{month:"ddd",week:"ddd M/d",day:"dddd M/d"},
		titleFormat:{month:"MMMM yyyy",week:"MMM d[ yyyy]{ '&#8212;'[ MMM] d yyyy}",day:"dddd, MMM d, yyyy"},
		buttonText:{prev:"&nbsp;&#9668;&nbsp;",next:"&nbsp;&#9658;&nbsp;",prevYear:"&nbsp;&lt;&lt;&nbsp;",nextYear:"&nbsp;&gt;&gt;&nbsp;",today:"aujourd'hui",month:"mois",week:"semaine",day:"jour"},
		monthNames:["Janvier", "F�vrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Ao�t", "Septembre", "Octobre", "Novembre", "D�cembre"],
		monthNamesShort:["Jan","F�v","Mar","Avr","Mai","Jun","Jul","Ao�","Sep","Oct","Nov","D�c"],
		dayNames:["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
		dayNamesShort:["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
		weekNumberTitle:"W"
	},
	
	/*********** DATEPICKER STUFF **************/
	
	/**
	 * "defaultDatePickerOpts" is used to set the standard options
	 * for a JQuery datepicker. 
	 *
	 * example: $("#fooInput").datepicker(orbisApp.defaultDatePickerOpts);
	 */
	defaultDatePickerOpts : {
		buttonImage: "/core/images/icons/calendar-16x16.png",
		buttonImageOnly: true,
		buttonText: "",
		changeMonth: true, 
		changeYear: true,
		dateFormat: "mm/dd/yy",
		yearRange:"-100:+15",
		showAnim: "fadeIn",
		showOn: "both"},
		
	defaultDatePickerOptsFR : {
		buttonImage: "/core/images/icons/calendar-16x16.png",
		buttonImageOnly: true,
		buttonText: "",
		changeMonth: true, 
		changeYear: true,
		dateFormat: "dd-mm-yy",
		yearRange:"-100:+15",
		showAnim: "fadeIn",
		showOn: "both"},
	
	/*********** DIALOG STUFF **************/
	
	numOfDialogs : 0,
	
	defaultDialogOpts : {
		resizable: false,
		draggable: true,
		modal: true,
		autoOpen: false,
		dialogClass: "orbisDialog",
		width: 600
		},
			
	/**
	 * A "private" function use for supporting dialog functionality.
	 */
	resetDialog : function (dialogDiv, options)
	{
		var dName;
		if (dialogDiv.substr(0, 1) == "#")
		{
			dName = $(dialogDiv).attr("id");
		}
		else if (dialogDiv.substr(0, 1) == ".")
		{
			dName = $(dialogDiv).attr("class");
		}
		else 
		{
			dName = dialogDiv;
		}
	
		var showTitle = $(dialogDiv).attr("title") != undefined && $(dialogDiv).attr("title") != null && $(dialogDiv).attr("title") != "";
	
		if (options)
		{
			$(dialogDiv).dialog(options);
		}
		else
		{
			$(dialogDiv).dialog(this.defaultDialogOpts);
		}	
		
		var thisDialog = $("div[aria-labelledby='ui-dialog-title-" + dName + "']");
	
		if (!showTitle)
		{		
			$(thisDialog).find(".ui-dialog-titlebar").css({"display" : "none"});
		}
		else
		{
			$(thisDialog).find(".ui-dialog-titlebar").css({"display" : "block"});
		}
			
		$(dialogDiv).dialog('option', 'open', function() { 
			$(this).css({'max-height': ($(window).height()-160), 'overflow-y':'auto'}); 
			$('.orbisDialog').css({position:"fixed", "top" : "40px", left : "40px"});
			if (options && options.open)
			{
				options.open();
			}
		});
		
		$(dialogDiv).dialog('option', 'buttons', {"Close": function(){ $(dialogDiv).dialog("close");}});		
		$(dialogDiv).dialog('option', 'closeOnEscape', true );			
	},
	
	/**
	 * A utility for turning any <div> into a standard dialog.  Once 
	 * this method is called, the target div will be turned into a dialog
	 * but you are still required to call $(divClassOrId).dialog("open");
	 * and $(divClassOrId).dialog("close"); to open and close the dialog
	 * respectively.
	 * 
	 * @param divClassOrId - a JQuery selector to your target div
	 * @param buttons - a JQuery dialog button object (for custom buttons)
	 * @param opts - a JQuery dialog options object (for custom dialog behaviour)
	 */
	setUpRegularDialog : function (divClassOrId, buttons, opts)
	{
		var modalContent = 
	          '<div class="modal-header">' +
	            '<a class="close" data-dismiss="modal" >&times;</a>' +
	            '<h3 class="modal-header-title"></h3>' +
	          '</div>' +
	          '<div class="modal-body"></div>' +
	          '<div class="modal-footer"></div>';
		if(buttons)
		{
			var size = 0;
			for (key in buttons)
			{
		        if (buttons.hasOwnProperty(key))
		        {
		        	size++;
		        }
		    }
			if(size == 0)
			{
				buttons = {
					Close : function(){$(this).modal("hide");}
				};
			}
		}
		else
		{
			buttons = {
				Close : function(){$(this).modal("hide");}
			};
		}
		$(divClassOrId).each(function(){
			var $newModal = $(modalContent);
			var originalContent = $(this).html();
			var uniqueId = Math.floor(Math.random()*100000);
			var modalTitleId = "modalTitle" + uniqueId;
			
			if(opts && opts.width)
			{
				$(this).on("shown", function(){
					$(this).css({
						"width" : parseInt(opts.width),
						"margin-left" : 0,
						"margin-top" : 0
					});
					var left = (parseInt($(window).width()) / 2) - (parseInt($(this).outerWidth()) / 2);
					var top = (parseInt($(window).height()) / 2) - (parseInt($(this).outerHeight()) / 2);
					$(this).css({
						top : top,
						left : left
					});
				});
			}
			
			var $modalContainer = $(this);
			$(this).addClass("modal hide");
			
			$newModal.find(".modal-header-title").attr("id", modalTitleId);
			
			if($(this).attr("title"))
			{
				$newModal.find(".modal-header-title").html($(this).attr("title"));
			}
			
			$newModal.filter(".modal-body").html(originalContent);
			if(buttons)
			{
				$.each(buttons, function(key, value){
					$('<a href="javascript:void(0);" class="btn">' + 
						key + 
					'</a>').click(function(){value.apply($modalContainer, [])}).appendTo($newModal.filter(".modal-footer"));
				});
			}

			$(this).attr({
				"aria-labelledby" : modalTitleId,
				"aria-hidden" : "true",
				"role" : "dialog"
			}).on("shown", function(){
				$(this).attr("aria-hidden", "false");
			}).on("hidden", function(){
				$(this).attr("aria-hidden", "true");
			}).html($newModal);
		});
	},
	setRegularDialogButtons : function(divClassOrId, buttons){
		var $modalContainer = $(divClassOrId);
		$modalContainer.find(".modal-footer").html(null);
		$.each(buttons, function(key, value){
			$('<a href="javascript:void(0);" class="btn">' + 
				key + 
			'</a>').click(function(){value.apply($modalContainer, [])}).appendTo($(divClassOrId).find(".modal-footer"));
		});
	},
	/**
	 * A "private" function use for supporting dialog functionality.
	 */
	extendOptions : function (options)
	{
		var extendableOpts = new Object();
		$.extend(extendableOpts, this.defaultDialogOpts);
		if (options)
		{
			return $.extend(extendableOpts, options);
		}
		return extendableOpts;
	},
	
	confirmModal : function(heading, question, cancelButtonTxt, okButtonTxt, callback)
	{
		var confirmModal = 
		      $('<div class="modal hide">' +    
		          '<div class="modal-header">' +
		            '<a class="close" data-dismiss="modal" >&times;</a>' +
		            '<h3>' + heading +'</h3>' +
		          '</div>' +

		          '<div class="modal-body">' +
		            '<p>' + question + '</p>' +
		          '</div>' +

		          '<div class="modal-footer">' +
		            '<a href="#" class="btn" data-dismiss="modal">' + 
		              cancelButtonTxt + 
		            '</a>' +
		            '<a href="#" id="okButton" class="btn btn-danger">' + 
		              okButtonTxt + 
		            '</a>' +
		          '</div>' +
		        '</div>');

	    confirmModal.find('#okButton').click(function(event) {
	        callback();
	        confirmModal.modal('hide');
	    });

	    confirmModal.modal('show');     		
	},
	
	/**
	 * A utility for showing a standard "confirmation dialog"
	 * 
	 * @param message<string> - the text to be displayed in the dialog
	 * @param okCallback<function>[optional] - the callback to be fired when "Ok" gets clicked.
	 * @param cancelCallback<function>[optional] - the callback to be fired when "Cancel" gets clicked.
	 * @param width<number>[optional] - the pixel-width of the dialog.
	 */
	confirmDialog: function (message, okCallback, cancelCallback, width)
	{
		var dID = "confirmModal_" + Math.floor(Math.random() * 99999);
		var dSelector = "#" + dID;
		var dHtml = '<div id="' + dID + '" class="modal hide" data-backdrop="static">' +
				'<div class="modal-header">' +
					'<h3>' + i18n.n968294344 + '</h3>' +
				'</div>' +
				'<div class="modal-body">' +
					message +
				'</div>' +
				'<div class="modal-footer">' +
					'<a href="javascript:void(0)" class="confirmOkBtn btn btn-primary">' + i18n.q8366135 + '</a>' +
					'<a href="javascript:void(0)" class="confirmCancelBtn btn">' + i18n.z121936338 + '</a>' +
				'</div>' +
			'</div>';		

		$("body").append(dHtml);

		$(dSelector).find('a.confirmOkBtn').click(function(event) {
			$(dSelector).modal('hide');
			if (okCallback) okCallback();
	    });

		$(dSelector).find('a.confirmCancelBtn').click(function(event) {
			$(dSelector).modal('hide');
			if (cancelCallback) cancelCallback();
	    });

		$(dSelector).modal("show");

		if (width)
		{
			width = width + "px";
			$(dSelector).css({width:width});
		}

		$(dSelector).on("hidden", function() {
		    $(this).remove();
		    $(this).removeData('modal', null);
		});
		
		return dSelector;
	},
	
	/**
	 * A utility for showing a standard "alert dialog"
	 * 
	 * @param message<string> - the text to be displayed in the dialog
	 * @param error<boolean> - when TRUE, the dialog will be styled as an "error alert".
	 * @param width<number>[optional] - the pixel-width of the dialog.
	 */
	alertDialog: function (message, error, width, callback)
	{
		var dID = "alertModal_" + Math.floor(Math.random() * 99999);
		var dSelector = "#" + dID;
		var dHtml = '<div id="' + dID + '" class="modal hide" role="alertdialog" aria-labelledby="alertDialogTitle">' +
				'<div class="modal-header">' +
					'<h3 id="alertDialogTitle">' + i18n.o312666927 + '</h3>' +
				'</div>' +
				'<div class="modal-body">' +
					message +
				'</div>' +
				'<div class="modal-footer">' +
					'<a href="javascript:void(0)" class="btn" data-dismiss="modal">' + i18n.cl1723834 + '</a>' +
				'</div>' +
			'</div>';		

		$("body").append(dHtml);
		
		if (error)
		{
			$(".modal-header", dSelector).css({"background-color":"#A00",color:"#FFF"});
		}
		
		$(dSelector).modal("show");

		if (width)
		{
			width = width + "px";
			$(dSelector).css({width:width});
		}

		$(dSelector).on("hidden", function() {
		    $(this).remove();
		    $(this).removeData('modal', null);
		    if (callback)
		    {
		    	callback();
		    }
		});
		
		return dSelector;
	},
	
	/**
	 * A utility for showing a standard "message dialog"
	 * NOTE: you must call "closeTempMessageDialog" to close it
	 * 
	 * @param text<string> - the message to display in the pop-up
	 * @param waitBar<boolean> - will show a "loading graphic" when TRUE
	 * @returns <string> - the JQuery selector of the pop-up (to be passed in the "closeTempMessageDialog" call)  
	 */
	openTempMessageDialog: function (text, waitBar)
	{
		if (waitBar)
		{
			 text += " <br /> <img src='/core/images/loading2.gif' />";
		}
	
		var dID = "tempModal_" + Math.floor(Math.random() * 99999);
		var dSelector = "#" + dID;
		var dHtml = '<div id="' + dID + '" class="modal hide" data-backdrop="static"><div class="modal-body"><center>' + text + '</center></div></div>';
		$("body").append(dHtml);
		$(dSelector).modal("show");
		$(dSelector).on("hidden", function() {
		    $(this).remove();
		    $(this).removeData('modal', null);
		});
		
		return dSelector;
	},
	
	/**
	 * A utility for closing a standard "message dialog"
	 *
	 * @param dName<string> - the JQuery selector that should be used for closing the "tempMessageDialog"
	 */
	closeTempMessageDialog: function (dSelector)
	{
		$(dSelector).modal("hide");
	},
	
	/**
	 * A utility for showing a standard "message dialog" which will
	 * automatically close after the specified "mili" seconds.
	 * 
	 * @param text<string> - the message to display in the pop-up
	 * @param mili<int> - this lengh of time (in miliseconds) before the pop-up closes
	 * @param callback<function> - the callback that will be fired after the pop-up closes
	 */
	timedMessageDialog: function (text, mili, callback)
	{
		var toClose = orbisApp.openTempMessageDialog(text);
		$(toClose).stepDelay(mili, function() {
			orbisApp.closeTempMessageDialog(toClose);
		});
		if (callback) { 
			$("html").stepDelay(mili, function() {callback();}); 
		}	
	},
	
	/**
	 * A "private" function use for supporting dialog functionality.
	 */
	centerDiv : function (nameOfContainer, nameOfChild)
	{
		cHeight = $(nameOfContainer).height();
		cWidth = $(nameOfContainer).width();
		
		tHeight = $(nameOfContainer + " " + nameOfChild).height();
		tWidth = $(nameOfContainer + " " + nameOfChild).width();
		
		$(nameOfContainer + " " + nameOfChild).css({"text-align" : "center"});	
		$(nameOfContainer + " " + nameOfChild).css({"margin-top" : ((cHeight/2) - (tHeight/2))});
		$(nameOfContainer + " " + nameOfChild).css({"margin-left" : ((cWidth/2) - (tWidth/2))});
	},
	
	/**
	 * A "private" function use for supporting dialog functionality.
	 */
	createDialogDiv : function ()
	{
		this.numOfDialogs++;
		var dName = "dialog_" + this.numOfDialogs;
		$("body").append("<div id='" + dName + "'></div>");
		return dName;
	},
	
	/**
	* function used within orbisApp.renderButtons()	
	*/
	setupButtons : function (entity, style)
	{
		var callback;
		var buttonText;
		var uniqueId = Math.floor(Math.random()*100000);
		var icons = new Object();
		var showWait = function(){};
		
		if($(entity).attr("showWait") == "true")
		{
			showWait = function(){
				$(entity).stepDelay(500, function() {
					orbisApp.openTempMessageDialog(i18n.e037553076, true);
				});
			};
		}

		if($(entity).attr("primaryIcon"))
		{
			icons.primary = $(entity).attr("primaryIcon"); 
		}
		if($(entity).attr("secondaryIcon"))
		{
			icons.secondary = $(entity).attr("secondaryIcon"); 
		}
		
		style.icons = icons;
		
		if($(entity).attr("width"))
		{
			if ($(entity).attr("width") == "auto") {
				style.width = "";
				style.padding = "0 5px 0 0";
			} else {
				style.width = $(entity).attr("width");
			}
		}
		
		orbisApp.addComponent("json");
				
		if($(entity).attr("style"))
		{
			var styleArray = $(entity).attr("style").split(";");
			for(var i = 0; i < styleArray.length; i++)
			{
				var styleElement = styleArray[i].split(":");
				if(styleElement.length == 2)
				{					
					style[orbisApp.trim(styleElement[0], " ")] = orbisApp.trim(styleElement[1], " ");
				}
			}
		}
		
		if($(entity).find("form").length != 0)
		{
			$(entity).find("form").attr("method", "post");
			$(entity).find("form").attr("id", uniqueId);
			$("body").append($(entity).find("form"));
			$(entity).find("form").remove();
	
			callback = function(){
				showWait();
				if($(entity).hasClass("confirm"))
				{
					orbisApp.confirmDialog(i18n.h17743726, function(){
						$("form#" + uniqueId).submit();
					});
				}
				else
				{
					$("form#" + uniqueId).submit();
				}
				
			};
			buttonText = $(entity).html();				
		}
		
		else if($(entity).find("a").length != 0)
		{
			var target = $(entity).find("a").prop("target");
			var href = $(entity).find("a").prop("href");
		
			if((target.toLowerCase() == "_blank") || (target.toLowerCase() == "blank"))
			{
				callback = function(){
					showWait();
					window.open(href);
				};
			}
			else
			{
				callback = function(){
					showWait();
					window.location = href;						
				};					
			}
			buttonText = $(entity).find("a").html();
		}	
		
		else if($(entity).is("input[type='submit']"))
		{
			callback = function(){};
		}
		
		else
		{
			if($(entity).attr("callback"))	
			{
				var callbackText = $(entity).attr("callback");
				if(callbackText.match("^function\(\)"))
				{
					callback = function(){showWait(); eval("(" + callbackText + ")()");};
				}
				else
				{
					callback = function(){showWait(); eval(callbackText)(entity);};
				}
			}
			
			else
			{
				callback = function(){};
				style.fontWeight = "";
			}
			
			buttonText = $(entity).html();
		}
		
		
		if($(entity).hasClass("orbisLink"))
		{
			var linkNumber = "link" + Math.floor(Math.random()*100000);
			$(entity).html('<a href="#" id="' + linkNumber + '">' + buttonText + '</a>');
			$("#" + linkNumber).click(function(){callback(); return false;});
		}
		else
		{
			$(entity).html(buttonText);
			$(entity).setUpButton(callback, style);
		}
		$(entity).attr("buttonRendered", "true");
	},
	
	/**
	 * function used within $.fn.tableHilight
	 */
	highlightHelper : function (entity, color)
	{	
		var col = $(entity).parent().children().index($(entity));
		$(entity).parent().parent().children().each(function(){
			$(this).find("td:eq("+col+")").css({background:color});
		});
		
		$(entity).parent().children().css({background:color});
	},
	
	/**
	* When this function is assigned to an anchor "onClick" event,
	* displayHome within the controller will be executed
	*/
	
	displayHome : function()
	{
		orbisApp.buildForm({action : 'displayHome'}).submit();
	},
	
	setTextareaLimit : function()
	{
		var i = 0;
		$("textarea.maxlength, input[type='text'].maxlength").each(function(){
			var maxLength = 255;
			if($(this).attr("maxlength") && $(this).attr("maxlength") != -1)
			{
				maxLength = $(this).attr("maxlength");
			}
			var initialLength = maxLength - $(this).val().length;
			var counterId = "counter" + i;
			var counter = "<br />" + i18n.w24268703 + ": <span id='"+counterId+"'>"+initialLength+"</span>";
			$(this).attr("counterId", counterId);
			$(counter).insertAfter(this);
			
			$(this).bind("keydown keyup paste", function(){
				var entity = this;
				setTimeout(function(){
					var textEntered = $(entity).val();
					var count = $("span#" + $(entity).attr("counterId"));
					var finalValue = textEntered;
					if(textEntered.length > maxLength)
					{
						finalValue = textEntered.substr(0, maxLength);
						$(entity).val(finalValue);
					}
					count.html(maxLength - finalValue.length);
				}, 1);
			});
				
			i++;
		});
	},
	
	renderBlinkTags : function(){
		$("blink").each(function(){
			var entity = this;
			setInterval(function(){orbisApp.blink(entity);}, $(entity).attr("freq") ? $(entity).attr("freq") : 700);
		});
	},
	
	blink: function(entity){
		$(entity).css("visibility", $(entity).css("visibility") == "visible" ? "hidden" : "visible");
	},

	/**
	 * Poll each ckeditor in the current page.  
	 * For each editor using our customer 'maxChars' feature, display the "characters remaining" to the user.
	 */
	pollOrbisEditors: function()
	{
		for (var editorId in CKEDITOR.instances)
		{
			var editor = CKEDITOR.instances[editorId];
			
			if (editor.maxChars)
			{
				var data = editor.getData();

				// Update the counter display...
				var counterId = "#charCount_" + editorId;
				$(counterId).html(editor.maxChars - data.length);

				if (editor.maxChars < data.length)
				{
					// Color counter red...
					$(counterId).css({"color":"red"});
					
					// Truncate content to "maxChars - 20"...
					editor.setData(data.substr(0, editor.maxChars - 20), function(){
						// Calls to setData() will cause loss of focus on the editor.
						// Therefore, re-establish focus...
						this.focus();

						// However, calls to focus() will only put the cursor at the beginning of the editor
						// Therefore, reposition the cursor to the "end of content"...
						var s = this.getSelection(); 
				        var selected_ranges = s.getRanges(); 
				        var node = selected_ranges[0].startContainer; 
				        var parents = node.getParents(true);
				        node = parents[parents.length - 2].getFirst();
				        while (true) {
				            var x = node.getNext();
				            if (x == null) {
				                break;
				            }
				            node = x;
				        }
				        s.selectElement(node);
				        selected_ranges = s.getRanges();
				        selected_ranges[0].collapse(false);  
				        s.selectRanges(selected_ranges); 
					});
				}
				else
				{
					// Color counter green...
					$(counterId).css({"color":"green"});
				}
			}	
		}	
	},
	
	/** This checks if the user is on a mobile device when the functions need to have a specific action 
	 * if they are using a mobile device (eg. double click for jqGrid)
	 */
	checkMobile: function(){
		var isMobile = new Boolean();
		
		if(navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/))
		{
			isMobile = true;
			
		}
		return isMobile;
	},
	
	/**
	 * This will get a byte array view of a file on the server.
	 * @param url - url to file
	 * @param name - name for the file (optional)
	 */
	
	downloadFile: function(url, name){
		if($("form#downloadFileForm").length == 0)
		{
			var newForm = $(document.createElement("form")).attr({
				method : "post",
				id : "downloadFileForm"
			});
			$(document.createElement("input")).attr({
				type : "hidden",
				name : "action",
				value : "downloadFile"
			}).appendTo(newForm);
			
			$(document.createElement("input")).attr({
				type : "hidden",
				name : "fileUrl",
				id : "fileUrl"
			}).appendTo(newForm);
			
			$(document.createElement("input")).attr({
				type : "hidden",
				name : "fileName",
				id : "fileName"
			}).appendTo(newForm);
			
			$(newForm).appendTo("body");
		}

		$("form#downloadFileForm input#fileUrl").val(url);
		$("form#downloadFileForm input#fileName").val(name);
		$("form#downloadFileForm").submit();
	},
	
	buildForm : function(parameters, action, target){
		orbisApp.addComponent("json");
		
		var theForm = $(document.createElement("form")).attr("method", "post").attr("action", action).attr("enctype","multipart/form-data");
		
		if (target)
		{
			theForm.attr("target", target);
		}
		
		$(theForm).insertObject(parameters);
		
		theForm.append($(document.createElement("input")).attr({
			type : "hidden",
			name : "rand",
			value : Math.floor(Math.random() * 100000)
		}));
		
		$(theForm).appendTo("body");
		return theForm;
	},
	
	displayErrorMessage : function(message, timeOpen){
		var opts = {
			message : message,
			icon : "/core/images/icons/close.png",
			title : "Error",
			clazz : "alert-error",
			timeOpen : timeOpen ? timeOpen : 5000
		};
		orbisApp.manageMessageBoxQueue(opts);
	},
	
	displayWarningMessage : function(message, timeOpen){
		var opts = {
			message : message,
			icon : "/core/images/icons/alert.png",
			title : "Warning",
			clazz : "alert-block",
			timeOpen : timeOpen ? timeOpen : 5000
		};
		orbisApp.manageMessageBoxQueue(opts);
	},
	
	displaySuccessMessage : function(message, timeOpen){
		var opts = {
			message : message,
			icon : "/core/images/icons/agt_action_success_128.png",
			title : "Success",
			clazz : "alert-success",
			timeOpen : timeOpen ? timeOpen : 5000
		};
		orbisApp.manageMessageBoxQueue(opts);
	},
	
	displayInfoMessage : function(message, timeOpen){
		var opts = {
			message : message,
			icon : "/core/images/icons/information.png",
			title : "Information",
			clazz : "alert-info",
			timeOpen : timeOpen ? timeOpen : 5000
		};
		orbisApp.manageMessageBoxQueue(opts);
	},
	
	manageMessageBoxQueue : function(opts){
		if(opts)
		{
			orbisMessageBoxQueue.push(opts);
		}
		
		var messageInProgress = $("div#orbisMessageBox").is(":visible")
		if(!messageInProgress && orbisMessageBoxQueue.length > 0)
		{
			orbisApp.displayMessageBox(orbisMessageBoxQueue[0])
		}
	},
	
	displayMessageBox : function(opts){
		orbisApp.buildMessageBox();
		
		$("div#orbisMessageBox>div").addClass(opts.clazz).css("border-width", "4px");
//		$("div#orbisMessageBox td#messageBoxIconContainer img").attr({
//			"src" : opts.icon,
//			"alt" : opts.title,
//			"title" : opts.title
//		});
		$("div#orbisMessageBox td#messageBoxTitleContainer").html(opts.title);
		$("div#orbisMessageBox td#messageBoxMessageContainer").html(opts.message);
		
		$("div#orbisMessageBox").fadeIn("slow");
		if(opts.timeOpen !== true)
		{
			orbisMessageBoxTimeout = setTimeout(orbisApp.hideMessageBox, opts.timeOpen);
		}
	},
	
	hideMessageBox : function(){
		clearTimeout(orbisMessageBoxTimeout);
		$("div#orbisMessageBox").fadeOut("slow", function(){
			if(orbisMessageBoxQueue.length > 0)
			{
				orbisMessageBoxQueue.splice(0,1);
				orbisApp.manageMessageBoxQueue();
			}
		});
	},
	
	buildMessageBox : function(){
		if($("div#orbisMessageBox").length == 0)
		{
			var $offsetContainer = $(document.createElement("div")).attr("id", "orbisMessageBox").css({
				display : "none",
				position : "fixed",
				width : "600px",
				left : "50%",
				top : "50px",
				"z-index" : "9000"
			});
			
			var $messageBoxContainer = $(document.createElement("div")).addClass("alert").css({
				width : "100%",
				left : "-50%",
				position : "relative"
			});
			
			var $closeButton = $(document.createElement("button")).addClass("close").attr("type", "button").html("x").css({
				position : "absolute",
				right : "15px",
				top : "10px"
			}).click(orbisApp.hideMessageBox);
			
			var $messageBoxLayout = $(document.createElement("table")).css({
				width : "100%"
			}).html(
				$(document.createElement("tr")).html(
					$(document.createElement("td")).css({
						//width: "140px"
						width: "0px"
					}).attr({
						id : "messageBoxIconContainer",
						rowSpan : 2
					}).html(
						$(document.createElement("img")).attr({
							"src" : "/core/images/spacer.gif",
							"alt" : "",
							"title" : ""
						})
					)
				).append(
					$(document.createElement("td")).css({
						height : "50px",
						"vertical-align" : "middle",
						"font-size" : "2em",
						"font-weight" : "bold"
						
					}).attr("id", "messageBoxTitleContainer")
				)
			).append(
				$(document.createElement("tr")).html(
					$(document.createElement("td")).css({
						"vertical-align" : "top"
					}).attr("id" , "messageBoxMessageContainer")
				)
			);
			
			$("body").append($offsetContainer.html($messageBoxContainer.html($messageBoxLayout).append($closeButton)));
		}
		else
		{
			$("div#orbisMessageBox>div").removeClass("alert-block alert-error alert-success alert-info");
			$("div#orbisMessageBox td#messageBoxIconContainer img").attr({
				"src" : "/core/images/spacer.gif",
				"alt" : "",
				"title" : ""
			});
			$("div#orbisMessageBox td#messageBoxTitleContainer").html(null);
			$("div#orbisMessageBox td#messageBoxMessageContainer").html(null);
		}
	},
	
	placeholderFix : function(){
		$('[placeholder]').focus(function() {
			  var input = $(this);
			  if (input.val() == input.attr('placeholder')) {
			    input.val('');
			    input.removeClass('placeholder');
			  }
			}).blur(function() {
			  var input = $(this);
			  if (input.val() == '' || input.val() == input.attr('placeholder')) {
			    input.addClass('placeholder');
			    input.val(input.attr('placeholder'));
			  }
			}).blur().parents('form').submit(function() {
			  $(this).find('[placeholder]').each(function() {
			    var input = $(this);
			    if (input.val() == input.attr('placeholder')) {
			      input.val('');
			    }
			  });
			});
	},
	
	applyTabsBehaviour : function(){
		var invalidContainer = new Array();
		$("div.orbisTabContainer").each(function(){
			var $container = $(this);
			
			$container.find("div.orbisTabContainer:not(div.tab-content div.orbisTabContainer)").each(function(){
				invalidContainer.push($container);
			});
			
			//This will make sure that the container we are in is validly placed within the tab structure.
			//If its not we ignore it and go on to the next container.
			for(var i = 0; i < invalidContainer.length; i++)
			{
				if($container.is(invalidContainer[i]))
				{
					return;
				}
			}
			
			var $tabsUl = $(this).find(".orbisModuleTabs:first ul.nav-tabs");
			var $activePanel = $(this).find("div.tab-content:first");
			var shortcutKeyUsed = false;
			
			setupTabs($tabsUl, $activePanel);
			
			$tabsUl.find("li a").focusin(function(){
				$(".orbisModuleTabs span.instruction").addClass("hidden");
				if(!$(this).parent().is(".active") && shortcutKeyUsed)
				{
					$(this).find("span.instruction").removeClass("hidden");
					shortcutKeyUsed = false;
				}
			}).focusout(function(){
				$(this).find("span.instruction").addClass("hidden");
			});
			
			/**
			 * chrome will not let me take over the shortcut keys ctrl+pgup and ctrl+pgdown.
			 * e.preventDefault(), e.stopPropagation() and e.stopImmediatePropagation()
			 * will not disable the chrome default shortcuts. :(
			 */
			if($(this).parents("div.orbisTabContainer").length == 0)
			{
				$activePanel.keydown(function(e){
					if((e.keyCode == keyCodes.left || e.keyCode == keyCodes.up) && e.ctrlKey)
					{
						e.preventDefault();
						shortcutKeyUsed = true;
						selectTab(getTabContainer($(this).find(":focus")).find(".orbisModuleTabs:first li.active"));
					}
					else if(e.keyCode == keyCodes.pageup && e.ctrlKey)
					{
						e.preventDefault();
						shortcutKeyUsed = true;
						selectPreviousTab(getTabContainer($(this).find(":focus")).find(".orbisModuleTabs:first li"), getTabContainer($(this).find(":focus")).find(".orbisModuleTabs:first li.active"));
					}
					else if(e.keyCode == keyCodes.pagedown && e.ctrlKey)
					{
						e.preventDefault();
						shortcutKeyUsed = true;
						selectNextTab(getTabContainer($(this).find(":focus")).find(".orbisModuleTabs:first li"), getTabContainer($(this).find(":focus")).find(".orbisModuleTabs:first li.active"));
					}
				});
			}

			$tabsUl.find("li a").keydown(function(e){
				if(e.keyCode == keyCodes.left || e.keyCode == keyCodes.up)
				{
					e.preventDefault();
					shortcutKeyUsed = true;
					selectPreviousTab($tabsUl.find("li"), $(this).parent());
				}
				else if(e.keyCode == keyCodes.right || e.keyCode == keyCodes.down)
				{
					e.preventDefault();
					shortcutKeyUsed = true;
					selectNextTab($tabsUl.find("li"), $(this).parent());
				}
				else if(e.keyCode == keyCodes.home)
				{
					e.preventDefault();
					shortcutKeyUsed = true;
					selectTab($tabsUl.find("li:first"))
				}
				else if(e.keyCode == keyCodes.end)
				{
					e.preventDefault();
					shortcutKeyUsed = true;
					selectTab($tabsUl.find("li:last"))
				}
			});
		});
		
		function getTabContainer($focused)
		{
			var $ret = $focused.parents("div.orbisTabContainer:first");

			if($focused.parents("div.orbisTabContainer").length > 1 && $focused.is("ul.nav-tabs>li>a"))
			{
				$ret = $focused.parents("div.orbisTabContainer").eq(1);
			}

			return $ret;
		}
		
		function setupTabs($tabsUl, $activePanel)
		{
			var $activeTabLink = $tabsUl.find("li.active a");
			var tabId = $activeTabLink.attr("id");
			
			$tabsUl.attr("role", "tabList");
			
			if(!tabId)
			{
				tabId = "activeTab" + Math.floor(Math.random()*100000);
				$activeTabLink.attr("id", tabId);
			}

			$tabsUl.find("li:not(.active) a").attr({
				tabIndex : "-1",
				"aria-selected" : "false"
			});
			
			$tabsUl.find("li:not(.active) a").each(function(){
				$(this).append(buildTabInscructions());
			});
			
			$activeTabLink.attr("aria-selected", "true");
			$tabsUl.find("li a").attr("role", "tab");
			
			$activePanel.attr({
				role : "tabpanel",
				"aria-labelledby" : tabId
			});
		}
		
		function buildTabInscructions()
		{
			return $(document.createElement("span")).addClass("instruction hidden").html("(Press enter to load)");
		}
		
		function selectNextTab($tabs, $tab)
		{
			var $newTab = $tabs.eq($tabs.index($tab) == $tabs.length - 1 ? 0 : $tabs.index($tab) + 1);
			return selectTab($newTab);
		}
		
		function selectPreviousTab($tabs, $tab)
		{
			var $newTab = $tabs.eq($tabs.index($tab) == 0 ? $tabs.length - 1 : $tabs.index($tab) - 1);
			return selectTab($newTab);
		}
		
		function selectTab($tab)
		{
			return $tab.find("a").focus();
		}
	}
};

/************** GLOBAL JQUERY EXTENSIONS **************/

$.fn.orbisChart = function(chartConfig) {
	orbisApp.addComponent("highCharts");
	chartConfig.chart.renderTo = $(this).prop("id");
	
	// eval tooltip formatter...
	if (chartConfig.tooltip && chartConfig.tooltip.formatter && typeof(chartConfig.tooltip.formatter) != "function")
	{
		chartConfig.tooltip.formatter = eval("(" + chartConfig.tooltip.formatter + ")");
	}
	
	// eval pie-dataLabels formatter...
	if (chartConfig.plotOptions && chartConfig.plotOptions.pie && chartConfig.plotOptions.pie.dataLabels && chartConfig.plotOptions.pie.dataLabels.formatter && typeof(chartConfig.plotOptions.pie.dataLabels.formatter) != "function")
	{
		chartConfig.plotOptions.pie.dataLabels.formatter = eval("(" + chartConfig.plotOptions.pie.dataLabels.formatter + ")");
	}
	

		return new Highcharts.Chart(chartConfig);
};



$.fn.orbisEditor = function(useFinder, toolbar, height, width, locale, maxChars) {

	var config = { allowedContent : true};

	if (navigator.userAgent.indexOf("Firefox") == -1)
	{
		// All browsers, besides FF, need this config to correctly copy & paste from MSWord
		config.forcePasteAsPlainText = true;
	}

	if (toolbar)
	{
		config.toolbar = toolbar;
	}
	if (height)
	{
		config.height = height;
	}
	if (width)
	{
		config.width = width;
	}
	if (locale)
	{
		config.language = locale;
	}

	return $(this).orbisEditorByConfig(config, useFinder, maxChars);
};

$.fn.orbisEditorByConfig = function(config, useFinder, maxChars) {
	$(this).ckeditor(config);
	var editor = $(this).ckeditorGet();
	
	if (useFinder)
	{
		CKFinder.setupCKEditor(editor, "/ckfinder/");
	}
	
	// maxChars behaviour...
	if ($.isNumeric(maxChars))
	{
		editor.maxChars = maxChars;
		
		var counterId = "charCount_" + $(this).prop("id");
		var counterDivId = "charCountDiv_" + $(this).prop("id");
		var counter = "<div id='" + counterDivId + "' style='font-size:x-small;'>" + i18n.m536012143 +": <b>" + maxChars + "</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; " + i18n.w24268703 + ": <span id='" + counterId + "' style='font-weight:bold;'></span></div>";
		$(counter).insertAfter(this);
		
		if (!orbisEditorPoller)
		{
			orbisEditorPoller = setInterval("orbisApp.pollOrbisEditors()", 1000);
		}
	}
	
	return editor;
};

$.fn.orbisFullCalendar = function(calOptions, otherOpts) {
	$(this).fullCalendar(calOptions);
};

$.fn.stepDelay = function(time, callback){
	$.fx.step.delay = function(){};
	return this.animate({delay:1}, time, callback); //the callback is the function that will wait for the delay to run before it executes
};

$.fn.coverThis = function(){
	if($(this).find("#" + $(this).attr("coverId")).length == 0)
	{
		$(this).attr("coverId", "cover" + coverCount);
		if($(this).css("position") == "static")
		{		
			$(this).css({"position":"relative"});
		}
		$(this).prepend("<div class='coverStyles' id='cover" + coverCount + "' style='margin-left: -"+$(this).css("padding-left")+"; margin-top: -"+$(this).css("padding-top")+";'></div>");		
		coverCount++;
	}
};

$.fn.uncoverThis = function(){	
	$(this).find("#" + $(this).attr("coverId")).remove();
	$(this).removeAttr("coverId");
};

$.fn.insertObject = function(obj){
	
	var $container = $(this);
	
	$.each(obj, function(name, value){
		
		var $element = $container.find("[name='"+name+"']");
		
		if(Object.prototype.toString.call(value) === '[object Array]')
		{
			$.each(value, function(arrayIndex, arrayValue){
				$container.append($(document.createElement("input")).attr({
					type : "checkbox",
					name : name,
					value : arrayValue,
					checked : "checked"
				}).css("display", "none"));
			});
		}
		else if(Object.prototype.toString.call(value) === '[object Object]')
		{
			if($element.length > 0)
			{
				$element.val(JSON.stringify(value));
			}
			else
			{
				$container.append($(document.createElement("input")).attr({
					type : "hidden",
					name : name,
					value : JSON.stringify(value)
				}));
			}
			
		}
		else
		{
			if($element.length > 0)
			{
				$element.val(value);
			}
			else
			{
				$container.append($(document.createElement("input")).attr({
					type : "hidden",
					name : name,
					value : value
				}));
			}
		}
	});

	return $container;
};

$.fn.groupCheckboxes = function(selectAll, widgetContainer){
		
	var checkAll = false;
	var groupOfChkBxs = this.selector;
	var lastChecked = null;	
	checkAll = $(groupOfChkBxs + ":checked").length == $(groupOfChkBxs).not(":disabled").length;
	$(selectAll).attr('checked', checkAll);
	
	if(widgetContainer)
	{
		widgetContainer.addClass("orbisCheckboxWidget");
	}
	if(selectAll)
	{			
		$(selectAll).click(function() {
			checkAll = $(selectAll).is(":checked");
			if(checkAll)
			{
				$(groupOfChkBxs).not(":disabled").not(":checked").prop("checked", true);
			}
			else
			{
				$(groupOfChkBxs).not(":disabled").filter(":checked").prop("checked", false);
			}
			
			if(widgetContainer)
			{
				widgetContainer.trigger("widgetChanged");
			}
		});
	}	
			
	$(groupOfChkBxs).click(function(event) {

		if(!lastChecked) 
		{
        	lastChecked = this;
        }

        if(event.shiftKey) 
        {
            var start = $(groupOfChkBxs).index(this);
            var end = $(groupOfChkBxs).index(lastChecked);
            $(groupOfChkBxs).slice(Math.min(start,end), Math.max(start,end) + 1).not(":disabled").attr("checked", lastChecked.checked);
        }

        lastChecked = this;

		checkAll = $(groupOfChkBxs + ":checked").length == $(groupOfChkBxs).not(":disabled").length;
		
		$(selectAll).prop("checked", checkAll);
		
		if(widgetContainer && !$(this).is(":disabled"))
		{
			widgetContainer.trigger("widgetChanged");
		}

	});
};

$.fn.checkboxWidget = function(opts){
	var methods = {
		update: function(){
			var randNum;
			var classes = $(this).find("input[type='checkbox']").attr("class").split(" ");
			for(var i = 0; i < classes.length; i++)
			{
				if(classes[i].indexOf("check") != -1)
				{
					randNum = classes[i].substr(5); 
				}
			}
			
			if(randNum)
			{
				if($(this).find("input[type='checkbox']:checked").length == $(this).find("input[type='checkbox']").length)
				{
					$("#widgetSelectAll" + randNum).prop("checked", "checked");
				}
				else
				{
					$("#widgetSelectAll" + randNum).prop("checked", null);
				}
			}
		}
	};
	
	if(methods[opts])
	{
		methods[ opts ].apply( this, Array.prototype.slice.call( arguments, 1 ));
	}
	else if(typeof opts === 'object' || ! opts)
	{
		$(this).each(function(){
			var cssProperties = new Object();
			var randNum = Math.floor(Math.random()*100000);
			var selectAllId = "widgetSelectAll" + randNum;
			var selectAllSelector = "#widgetSelectAll" + randNum;	
			var centerStyle = "";
			
			//***The following set of variables contains default values***//	
			var height = "100px";
			var width = "200px";
			var selectAll = true;	
			
			if(opts)
			{
				if(opts.height)
				{
					height = opts.height;		
				}				
				
				if(opts.width)
				{		
					width = opts.width;
				} 
				
				if(!opts.selectAll && opts.selectAll != null)
				{		
					selectAll = false;
					selectAllSelector = "";
				}
				if(opts.center)
				{
					centerStyle = "margin-left: auto; margin-right: auto;";
					cssProperties.marginLeft = "auto";
					cssProperties.marginRight = "auto";
				}
				if(opts["max-height"])
				{
					height = null;
					cssProperties["max-height"] = opts["max-height"];
				}
	
			}
		
			cssProperties.width = width;
			cssProperties.height = height;
			cssProperties.overflow = "auto";
			cssProperties.border = "1px solid black";
			cssProperties.background = "#FFFFFF";
			
			if(selectAll || selectAll == null)
			{
				var prepend = '<div class="checkboxWidgetHeader" style="'+centerStyle+' text-align: left; border: 1px solid black; border-bottom: 0px; padding: 5px; width: '+width+'; height: 15px; background-color: #e5e5e5;"><label style="margin-bottom: 0; display: inline-block; float: none;"><input style="width: auto;margin-right:5px;vertical-align:-2px;" id="'+selectAllId+'" type="checkbox" id="widgetSelectAll" />' + i18n.a40369725 + '</label></div>';
				cssProperties.borderTop = 0;
				cssProperties.padding = "5px";
				$(prepend).insertBefore($(this));
			}
		
			$(this).find("input[type='checkbox']").each(function(){$(this).addClass("check" + randNum);});
			$("input.check" + randNum).groupCheckboxes(selectAllSelector, $(this));
			$(this).css(cssProperties);
		});
	}
	else
	{
		$.error(i18n.u93742358);
	}
	
	return $(this);
};

$.fn.tableHighlight = function(color){
	var prevColor;
	var table = this;	
	
	$(this).find("td").not(".untouchable").hover(function(){	
		prevColor = $(this).css("background-color");		
		orbisApp.highlightHelper(this, color);
	},
	function(){		
		orbisApp.highlightHelper(this, prevColor);
	});
};

/**
* A utility that will take an element and transform it into a JQueryUI 
* button. The content of that element will be the one used to be the
* content within the button.
* @param callback<function> - This function will be executed when the button is clicked.
* @param opts<Object[]> - This can contain extra button opts along with any CSS properties that
* are to be applied to the button. 
*/	

$.fn.setUpButton = function (callback, opts) {		
	$(this).button(opts);		
	
	if(callback)
		$(this).click(function(){
			if($(this).button("option", "disabled") != true && $(this).button("option", "disabled") != "disabled")
			{
				callback.apply(this);
			}
		});

	if(opts)		
		$(this).css(opts);
};

/**
 * RSS Widget: 
 *      loads rss feeds into a target container.
 *
 * USAGE EXAMPLES:
 * 		$("#containerDiv").rssWidget({urls: ["http://www.reddit.com/.rss", "http://feeds.digg.com/digg/popular.rss"]});
 * 		$("#containerDiv").rssWidget({limit:10, urls: ["http://www.reddit.com/.rss", "http://feeds.digg.com/digg/popular.rss"]});
 * 		$("#containerDiv").rssWidget({dateSort: "asc", limit:10, urls: ["http://www.reddit.com/.rss", "http://feeds.digg.com/digg/popular.rss"]});
 * 		$("#containerDiv").rssWidget({dateFormat: "hide", limit:10, urls: ["http://www.reddit.com/.rss", "http://feeds.digg.com/digg/popular.rss"]});
 * 		$("#containerDiv").rssWidget({dateFormat: "MM dd, yyyy", limit:10, urls: ["http://www.reddit.com/.rss", "http://feeds.digg.com/digg/popular.rss"]});
 *
 * OPTIONS:
 *      urls  (optional): An array of rss urls.
 *      limit (optional): An integer to specify a maximum limit of feed-items.
 *      dateSort   (optional): Specify "asc" or "desc" to indicate which direction you want feed-items sorted by date.  Default is "desc" (newest on top). 
 *		dateFormat (optional): The format-string (ala: SimpleDateFormat) of the date.  Specify "hide" to hide the date altogether. Default value is "MMM dd, yyyy @ h:mm a z"
 */
$.fn.rssWidget = function (opts) {
	if (!orbisApp.isEmpty(opts) && orbisApp.isArray(opts.urls))
	{
		orbisApp.addComponent("json");
		
		var request = new Object();
		request.action = "loadRssFeeds";
		request.opts = JSON.stringify(opts);
		request.rnd = Math.random() * 10000;
		
		$(this).html("<center><B style='color:blue;'>" + i18n.j07234968 + "....</B></center>");
		
		$(this).load("/rss.htm", request, function(response, status, xhr) 
		{
			if (!orbisApp.checkAjaxResponse(xhr))
			{
				$(this).html("<center><B style='color:red;'>" + i18n.i413033843 + "</B></center>");
			}
		});
	}
	else
	{
		$(this).html("<center><B style='color:red;'>" + i18n.i413033843 + "</B></center>");
	}
};

$.fn.serializeFormToObject = function(){
	if ($.isEmptyObject(CKEDITOR.instances) == false)
	{
		for(var i in CKEDITOR.instances) CKEDITOR.instances[i].updateElement();
	}
	
	var serializedArray = $(this).serializeArray();
	var ret = new Object();

	$.each(serializedArray, function() {
	    if (ret[this.name])
	    {
	        if (!ret[this.name].push) 
	        {
	     	   ret[this.name] = [ret[this.name]];
	        }

	        ret[this.name].push(this.value || '');
	    } 
	    else 
	    {
	 	   ret[this.name] = this.value || '';
	    }
	});
	return ret;
};

$.fn.adjustIframe = function(iframeId){

	if(this.length > 0)
	{
		var theWindow = this[0];
		var iframeBody = theWindow.document.body;
		$("iframe#" + iframeId).width($(iframeBody).find("div#sizeContainer").length > 0 ? $(iframeBody).find("div#sizeContainer").width() : $(iframeBody).width());
		$("iframe#" + iframeId).height($(iframeBody).find("div#sizeContainer").length > 0 ? $(iframeBody).find("div#sizeContainer").height() : $(iframeBody).height());

		$("iframe#" + iframeId).css({
			border : 0,
			padding : 0
		});
		
		$(iframeBody).css({
			border : 0,
			padding : 0,
			margin : 0
		});
		
		$(this).show();
	}
};

/**
 * Z-Index fix for dialogs spawned by the CKEditor in a dialog.
 * This will allow you to actually type into textboxes that are in
 * dialogs created by CKEditor. The bug occured when we placed a CKEditor
 * in a dialog. This was taken from the JQuery UI bug Ticket #4727
 */

$.extend($.ui.dialog.overlay, { create: function(dialog){
    if (this.instances.length === 0) {
	    // prevent use of anchors and inputs
	    // we use a setTimeout in case the overlay is created from an
	    // event that we're going to be cancelling (see #2804)
	    setTimeout(function() {
	        // handle $(el).dialog().dialog('close') (see #4065)
	        if ($.ui.dialog.overlay.instances.length) {
	            $(document).bind($.ui.dialog.overlay.events, function(event) {
	                var parentDialog = $(event.target).parents('.ui-dialog');
	                if (parentDialog.length > 0) {
	                    var parentDialogZIndex = parentDialog.css('zIndex') || 0;
	                    return parentDialogZIndex > $.ui.dialog.overlay.maxZ;
	                }
	               
	                var aboveOverlay = false;
	                $(event.target).parents().each(function() {
	                    var currentZ = $(this).css('zIndex') || 0;
	                    if (currentZ > $.ui.dialog.overlay.maxZ) {
	                        aboveOverlay = true;
	                        return;
	                    }
	                });

	                return aboveOverlay;
	            });
	        }
	    }, 1);
	   
	    // allow closing by pressing the escape key
	    $(document).bind('keydown.dialog-overlay', function(event) {
            (dialog.options.closeOnEscape && event.keyCode && event.keyCode == $.ui.keyCode.ESCAPE && dialog.close(event));
	    });
	           
	    // handle window resize
	    $(window).bind('resize.dialog-overlay', $.ui.dialog.overlay.resize);
    }
   
    var $el = $('<div></div>').appendTo(document.body).addClass('ui-widget-overlay').css({
        width: this.width(),
        height: this.height()
    });
   
    (dialog.options.stackfix && $.fn.stackfix && $el.stackfix());
   
    this.instances.push($el);
    return $el;
}});


/************** LEGACY FUNCTIONS **************/

function doFckSubmit(form, btnAction, isSubmitForm) {
	if ( btnAction != null )
	{
		if (form.button != null)
		{
			form.button.value = btnAction;
		}
		
		if (form['siteElement.button'] != null)
		{
			form['siteElement.button'].value = btnAction;
		}
	}
	
	if ( isSubmitForm )
	{
		$(form).submit();
	}
	return true;
}	

