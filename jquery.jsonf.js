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
		
		function fieldval($field) {
			var type = $field.attr('type'); 
			if(type=='checkbox') return $field.is(':checked');
			if(type=='radio' && !$field.is(':checked')) return undefined;
			//if(type=='radio') return $field.attr('checked'); 
			return $field.val();
		}
		
		function serialize() {
			var formobjects = $(formroot).find(sel_object).each(function(){ $(this).data(opts.marker,{}) });
			var formarrays = $(formroot).find(sel_array).each(function(){ $(this).data(opts.marker,[]) });
		
			var rootobj = {};
			var hits = $(formroot).find(opts.fields).add(formobjects).add(formarrays);
			hits.each(function(){
				var $hit = $(this), name, val;
				if( $hit.is(sel_object_or_array) ) {
					name = opts.getname.apply(this);
					val = $hit.data(opts.marker);
				} else {
					name = $hit.attr('name');
					val = fieldval($hit);
					if(val==undefined) return; //abstain (e.g. unselected radio button)
				}
		
				var parent = $hit.parentsUntil(formroot).filter(sel_object_or_array).eq(0);
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
