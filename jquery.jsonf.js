(function($){ 
	
	var parseBoolean = function(string) {
		if(!string) return null;
        switch(string.toLowerCase()){
                case "true": case "yes": case "1": return true;
                case "false": case "no": case "0": return false;
                default: return null;
        }
	}

	var defaults = {
		fields: 'input,select,textarea,button',	//':input[name]:enabled',
		marker: 'jsonf',
		json: null,
		valueFilters: {},
		getname: function(){
			var $e = $(this);
			if($e.is('[name]')) return $e.attr('name');
			if($e.metadata) return $e.metadata().name;
			return undefined;
		}
	};

	$.fn.jsonf = function(method, opts) {
		if(typeof method !== "string") {
			method = 'save';
			opts = method;
		}
		
		opts = $.extend(defaults, opts);
		
		if(!opts.sel_object) opts.sel_object = '.' + opts.marker;
		if(!opts.sel_array) opts.sel_array = '.' + opts.marker + '-array';
		if(!opts.class_template) opts.class_template = opts.marker + '-template';
		if(!opts.sel_template) opts.sel_template = '.' + opts.class_template;
		opts.sel_object_or_array = opts.sel_object + ',' + opts.sel_array;
		
		opts.valueFilters['input[type=radio]:not(:checked),input[type=checkbox]:not(:checked)'] = undefined;
		opts.valueFilters['.' + opts.marker + '-number'] = parseFloat;
		opts.valueFilters['.' + opts.marker + '-integer'] = parseInt;
		opts.valueFilters['.' + opts.marker + '-boolean'] = parseBoolean;

		//templates! hide and save them
		$(opts.sel_template).each(function(){
			var $tpl = $(this);
			var $parent = $tpl.parents(opts.sel_object_or_array).first();
			$tpl.remove(); //remove only after calculating parent
			$tpl.removeClass(opts.class_template)
			$parent.data(opts.sel_template, $tpl);
		});
		
		var fieldval = function($field) {
			var val = $field.val();
			for(key in opts.valueFilters) {
				if($field.is(key)) try {
					var filter = opts.valueFilters[key];
					return (typeof filter === "function") ? filter(val) : filter;
				} catch(ex){}
			}
			return val;
		}
		
		function save() {
			var $formroot = $(this);
			$formroot.data(opts.marker, $formroot.is(opts.sel_array) ? [] : {});
			var formobjects = $formroot.find(opts.sel_object).each(function(){ $(this).data(opts.marker,{}) });
			var formarrays = $formroot.find(opts.sel_array).each(function(){ $(this).data(opts.marker,[]) });
			
			var $hits = $formroot.find(opts.fields).filter(':not(:disabled)').add(formobjects).add(formarrays);
			$hits.each(function(){
				var $hit = $(this), name, val;
			
				var $parent = $hit.parentsUntil($formroot).filter(opts.sel_object_or_array).eq(0);
				if(!$parent.length) $parent = $formroot;
				var parentobj = $parent.data(opts.marker);
				var parentIsArray = $.isArray(parentobj);
			
				if( $hit.is(opts.sel_object_or_array) ) {
					if(!parentIsArray) name = opts.getname.apply(this);
					val = $hit.data(opts.marker);
				} else {
					name = $hit.is('[name]') && $hit.attr('name') || undefined;
					val = fieldval($hit);
					if(val===undefined) return; //abstain (e.g. unselected radio button)
				}
				
				if(parentIsArray) {
					parentobj.push(val);
				} else if(name) {
					parentobj[name] = val;
				}
			});
			return $formroot.data(opts.marker);
		};
		
		function load(formroot) {
			//TODO implement loading from JSON into form elements
			return this;
		};
		
		function add() {
			//TODO add an array element from template
			var $tpl = $(this).data(opts.sel_template);
			$tpl.clone().appendTo(this);
			return $tpl;
		};
		
		if(opts.json) return this.map(load);
		
		var methods = { save: save, load: load, add: add };
		
		var ret = this.map(methods[method]);
		
		return (ret && ret.length < 2) ? ret.get(0) : ret;
	};
})(jQuery);
