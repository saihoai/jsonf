(function($){ 
	
	var parseBoolean = function(string) {
		if(!string) return null;
        switch(string.toLowerCase()){
                case "true": case "yes": case "1": return true;
                case "false": case "no": case "0": return false;
                default: return null;
        }
	}

	function initopts(opts) {
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
		
		opts = $.extend(defaults, opts);
		
		if(!opts.sel_object) opts.sel_object = '.' + opts.marker;
		if(!opts.sel_array) opts.sel_array = '.' + opts.marker + '-array';
		if(!opts.class_template) opts.class_template = opts.marker + '-template';
		if(!opts.data_children) opts.data_children = opts.marker + '-children';
		if(!opts.sel_template) opts.sel_template = '.' + opts.class_template;
		opts.sel_object_or_array = opts.sel_object + ',' + opts.sel_array;
		
		//valueFilters act like $().val() but with special handling
		//build the map using bracket notation because the string concats cause parse errors in {key:value} notation
		opts.valueFilters['.' + opts.marker + '-number'] = {get: parseFloat, set: String };
		opts.valueFilters['.' + opts.marker + '-integer'] = {get: parseInt, set: String };
		opts.valueFilters['.' + opts.marker + '-boolean'] = {get: parseBoolean, set: String };
		opts.valueFilters['input[type=radio],input[type=checkbox]'] = {get: function(val){
				return this.is(':checked') ? val : undefined;
			}, set: function(val) {
				if(val && this.val()==val) this.attr('checked','checked'); 
				return this.val();
			}};
		
		return opts;
	}

	$.fn.jsonf = function(method, opts) {
		if(typeof method !== "string") {
			method = 'save';
			opts = method;
		}
		if(method == 'load') {
			opts = {json:opts};
		}
		
		opts = initopts(opts);
		
		
		/**
		 * @param this the field to set or get
		 * @param newval if supplied, set the value (otherwise just return it)
		 * @return field value, or set it if argument is supplied
		 **/
		var fieldval = function(newval) {
			var $field = $(this);

			if( $field.is(opts.sel_object_or_array) ) {
				if(newval) $field.data(opts.marker, newval);
				return $field.data(opts.marker);
			}

			var retval = $field.val();
			for(key in opts.valueFilters) {
				if($field.is(key)) try {
					var filter = opts.valueFilters[key];
					if(newval) { //set
						newval = filter.set.apply($field,[newval]);
					} else { //get
						retval = filter.get.apply($field,[retval]);
					}
				} catch(ex){}
			}
			if(newval && newval !== retval) {
				$field.val(newval);
				retval = $field.val();
			}

			return retval;
		}
		
		var initjsonf = function() {
			var $jsonf = $(this);
			$jsonf.addClass(opts.marker);
			$jsonf.data(opts.marker,{});
			$jsonf.data(opts.data_children, $([]) );
		};
		var initjsonfarray = function() {
			$(this).data(opts.marker,[]);
		};
		
		var init_hits = function(){
			var $root = $(this),
				$objects = $root.find(opts.sel_object).each(initjsonf),
				$arrays = $root.find(opts.sel_array).each(initjsonfarray);

			var $hits = $root.find(opts.fields).filter(':not(:disabled)').add($objects).add($arrays);
			$hits.each(function(){
				var $hit = $(this), name, val;
				
				var $parent = $hit.parentsUntil($root).filter(opts.sel_object_or_array).eq(0);
				if(!$parent.length) $parent = $root;
				var parentobj = $parent.data(opts.marker);
				var parentIsArray = $.isArray(parentobj);
				
				if(!parentIsArray) name = opts.getname.apply($hit);
				val = fieldval.apply($hit);
				
				if(name) { //add this child to its parent's list of jsonf children
					var $siblings = $parent.data(opts.data_children);
					$parent.data(opts.data_children, $siblings.add($hit));
				}
				
				if(val !== undefined) { //to abstain from recording a value, return undefined (e.g. unselected radio button)
					if(parentIsArray) {
						parentobj.push(val);
					} else if(name) {
						parentobj[name] = val;
					}
				}
			});
		};

		function add() {
			var $item = $(this).data(opts.sel_template).clone().appendTo(this);
			if($item.is(opts.sel_object)) initjsonf.apply($item);
			if($item.is(opts.sel_array)) initjsonfarray.apply($item);
			init_hits.apply($item);
			return $item;
		};
		
		function save() {
			return $formroot.data(opts.marker);
		};
		
		/** @param this the dom object to load **/
		function load(data) {
			var $root = $(this);
			if($root.is(opts.sel_object)) {
				$root.data(opts.data_children).each(function(){
					var $child = $(this), name = opts.getname.apply($child), val = data[name];
					if(!val) return;
					load.apply($child, [val]);
				});
			} else if($root.is(opts.sel_array)) {
				for(var k = 0; k < data.length; k++) {
					var val = data[k], $child = add.apply($root);
					load.apply($child, [val]);
				}
			} else if(!$root.is(opts.fields)) {
				$root.children().each(function(){
					load.apply(this, [data]);
				});
			} else {
				fieldval.apply($root, [data])
			}
			return $root;
		};
		
		
		
		//templates! hide and save them
		$(opts.sel_template).each(function(){
			var $tpl = $(this);
			var $parent = $tpl.parents(opts.sel_object_or_array).first();
			$tpl.remove(); //remove only after calculating parent
			$tpl.removeClass(opts.class_template)
			$parent.data(opts.sel_template, $tpl);
		});

		if(method == 'add') {
			return this.map(add);
		}
		
		var $formroot = $(this);
		$formroot.each( $formroot.is(opts.sel_array) ? initjsonfarray : initjsonf );
		init_hits.apply($formroot);
		
		var ret;
		if(opts.json) ret = load.apply($formroot, [opts.json]);
		else ret = this.map(save);
		
		return (ret && ret.length < 2) ? ret.get(0) : ret;
	};
})(jQuery);
