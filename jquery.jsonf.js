(function($){ 

	$.fn.jsonf = function(opts) {
		var defaults = {
			fields: ':input:enabled',	//':input[name]:enabled',
			marker: 'jsonf',
			json: null,
			getname: function(){ return $(this).metadata().name; }
		};
		opts = $.extend(defaults, opts);
		
		var sel_object = '.' + opts.marker,
			sel_array = '.' + opts.marker + '-array',
			sel_object_or_array = sel_object + ',' + sel_array,
			formroot = this;
		
		function serialize() {
			var formobjects = $(formroot).find(sel_object).each(function(){ $(this).data(opts.marker,{}) });
			var formarrays = $(formroot).find(sel_array).each(function(){ $(this).data(opts.marker,[]) });
		
			var rootobj = {};
			var hits = $(formroot).find(opts.fields).add(formobjects).add(formarrays);
			hits.each(function(){
				var name, val;
				if( $(this).is(sel_object_or_array) ) {
					name = opts.getname.apply(this);
					val = $(this).data(opts.marker);
				} else {
					name = $(this).attr('name');
					val = $(this).val();
				}
		
				var parent = $(this).parentsUntil(formroot).filter(sel_object_or_array).eq(0);
				var parentobj = parent.length ? parent.data(opts.marker) : rootobj;
				if($.isArray(parentobj)) {
					parentobj.push(val);
				} else {
					parentobj[name] = val;
				}
			});
			return rootobj;
		};
		
		function load(formroot) {
			//TODO implement loading from JSON into form elements
			return this;
		};
	
		if(opts.json) return this.map(load);
		
		var ret = this.map(serialize);
		return (ret && ret.length < 2) ? ret.get(0) : ret;
	};
})(jQuery);
