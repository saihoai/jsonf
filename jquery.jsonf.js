(function($){ 
	
	var parseBoolean = function(string) {
		if(!string) return null;
        switch(string.toLowerCase()){
                case "true": case "yes": case "1": return true;
                case "false": case "no": case "0": return false;
                default: return null;
        }
	}

	$.fn.jsonf = function(opts) {
		var defaults = {
			fields: ':input:enabled',	//':input[name]:enabled',
			marker: 'jsonf',
			json: null,
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
		opts.sel_object_or_array = opts.sel_object + ',' + opts.sel_array;

		var fieldval = function($field) {
			var type = $field.attr('type'); 
			if(type=='checkbox' && !$field.is(':checked')) return undefined;
			if(type=='radio' && !$field.is(':checked')) return undefined;
			var val = $field.val();
			if($field.is('.' + opts.marker + '-number')) try { return parseFloat(val); } catch(ex){}
			if($field.is('.' + opts.marker + '-integer')) try { return parseInt(val); } catch(ex){}
			if($field.is('.' + opts.marker + '-boolean')) try { return parseBoolean(val); } catch(ex){}
			//if(type=='radio') return $field.attr('checked'); 
			return val;
		}
		
		var serialize = function() {
			var $formroot = $(this);
			$formroot.data(opts.marker, $formroot.is(opts.sel_array) ? [] : {});
			var formobjects = $formroot.find(opts.sel_object).each(function(){ $(this).data(opts.marker,{}) });
			var formarrays = $formroot.find(opts.sel_array).each(function(){ $(this).data(opts.marker,[]) });
			
			var $hits = $formroot.find(opts.fields).add(formobjects).add(formarrays);
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
		
		var load = function(formroot) {
			//TODO implement loading from JSON into form elements
			return this;
		};
	
		if(opts.json) return this.map(load);
		
		var ret = this.map(serialize);
		return (ret && ret.length < 2) ? ret.get(0) : ret;
	};
})(jQuery);
