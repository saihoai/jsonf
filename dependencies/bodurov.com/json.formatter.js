/*
Quick Json Formatter Online 1.0 Copyright (c) 2008-2009 Vladimir Bodurov
http://quickjsonformatter.codeplex.com/
Copyright (c) 2008 Vladimir Bodurov
Encapsulated as a jquery plugin by Jeoff Wilks <jeoffwilks@gmail.com>
License: The MIT License (MIT)
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function($){

	function IsArray(obj) {
	  return obj && 
			  typeof obj === 'object' && 
			  typeof obj.length === 'number' &&
			  !(obj.propertyIsEnumerable('length'));
	}

	/**convert a string to JSON; borrowed from jquery 1.4 **/
	function forceJSON(data) {
		if(typeof data === "object")
			return data;

		// Try to use the native JSON parser first
		if ( window.JSON && window.JSON.parse ) {
			data = window.JSON.parse( data );
		} else {
			data = (new Function("return " + data))();
		}
		return data;
	}

	function MultiplyString(num, str){
	  var sb =[];
	  for(var i = 0; i < num; i++){
		sb.push(str);
	  }
	  return sb.join("");
	}

	function TraverseChildren(element, func, depth){
	  for(var i = 0; i < element.childNodes.length; i++){
		TraverseChildren(element.childNodes[i], func, depth + 1);
	  }
	  func(element, depth);
	}
	function pad(width,num) {
		var str = '' + num;
		while(str.length < width) {
			str = '0' + str;
		}
		return str;
	}
	function toISOString(d) {
       return d.getUTCFullYear() + '-' +  pad(2,d.getUTCMonth() + 1) + '-' + pad(2,d.getUTCDate())
		+ 'T' + pad(2,d.getUTCHours()) + ':' +  pad(2,d.getUTCMinutes()) + ':' + pad(2,d.getUTCSeconds())
		+ '.' + pad(3,d.getUTCMilliseconds()) + 'Z';
	}
	//add Date.toISOString() to IE 6/7
	if(!Date.prototype.toISOString)
		Date.prototype.toISOString = function() { return toISOString(this); };
		
	
$.fn.prettyjson = function(json, opts){
	// we need tabs as spaces and not CSS magin-left 
	// in order to ratain format when copying and pasting the code
	var defaults = {
		SINGLE_TAB: "  ",
		ImgCollapsed: "dependencies/bodurov.com/images/Collapsed.gif",
		ImgExpanded: "dependencies/bodurov.com/images/Expanded.gif",
		QuoteKeys: true,
		IsCollapsible: true
	};
	opts = $.extend(defaults, opts);
	if(!opts.TAB) opts.TAB = opts.SINGLE_TAB;


	function ProcessObject(obj, indent, addComma, isArray, isPropertyContent){
	  var html = "";
	  var comma = (addComma) ? "<span class='Comma'>,</span> " : ""; 
	  var type = typeof obj;
	  var clpsHtml ="";
	  if(obj instanceof Date || obj.getMonth) {
		return FormatLiteral(obj.toISOString(), "\"", comma, indent, isArray, "Date");
	  }else if(IsArray(obj)){
		if(obj.length == 0){
		  html += GetRow(indent, "<span class='ArrayBrace'>[ ]</span>"+comma, isPropertyContent);
		}else{
		  clpsHtml = opts.IsCollapsible ? '<span><img class="expand" src="'+opts.ImgExpanded+'"/></span><span class="collapsible">' : '';
		  html += GetRow(indent, "<span class='ArrayBrace'>[</span>"+clpsHtml, isPropertyContent);
		  for(var i = 0; i < obj.length; i++){
			html += ProcessObject(obj[i], indent + 1, i < (obj.length - 1), true, false);
		  }
		  clpsHtml = opts.IsCollapsible ? "</span>" : "";
		  html += GetRow(indent, clpsHtml+"<span class='ArrayBrace'>]</span>"+comma);
		}
	  }else if(type == 'object' && obj == null){
		html += FormatLiteral("null", "", comma, indent, isArray, "Null");
	  }else if(type == 'object'){
		var numProps = 0;
		for(var prop in obj) numProps++;
		if(numProps == 0){
		  html += GetRow(indent, "<span class='ObjectBrace'>{ }</span>"+comma, isPropertyContent);
		}else{
		  clpsHtml = opts.IsCollapsible ? '<span><img class="expand" src="'+opts.ImgExpanded+'"/></span><span class="collapsible">' : '';
		  html += GetRow(indent, "<span class='ObjectBrace'>{</span>"+clpsHtml, isPropertyContent);
		  var j = 0;
		  for(var prop in obj){
			var quote = opts.QuoteKeys ? "\"" : "";
			html += GetRow(indent + 1, "<span class='PropertyName'>"+quote+prop+quote+"</span>: "+ProcessObject(obj[prop], indent + 1, ++j < numProps, false, true));
		  }
		  clpsHtml = opts.IsCollapsible ? "</span>" : "";
		  html += GetRow(indent, clpsHtml+"<span class='ObjectBrace'>}</span>"+comma);
		}
	  }else if(type == 'number'){
		html += FormatLiteral(obj, "", comma, indent, isArray, "Number");
	  }else if(type == 'boolean'){
		html += FormatLiteral(obj, "", comma, indent, isArray, "Boolean");
	  }else if(type == 'function'){
		obj = FormatFunction(indent, obj);
		html += FormatLiteral(obj, "", comma, indent, isArray, "Function");
	  }else if(type == 'undefined'){
		html += FormatLiteral("undefined", "", comma, indent, isArray, "Null");
	  }else{
		html += FormatLiteral(obj.toString().split("\\").join("\\\\").split('"').join('\\"'), "\"", comma, indent, isArray, "String");
	  }
	  return html;
	}
	function FormatLiteral(literal, quote, comma, indent, isArray, style){
	  if(typeof literal == 'string')
		literal = literal.split("<").join("&lt;").split(">").join("&gt;");
	  var str = "<span class='"+style+"'>"+quote+literal+quote+comma+"</span>";
	  if(isArray) str = GetRow(indent, str);
	  return str;
	}
	function FormatFunction(indent, obj){
	  var tabs = "";
	  for(var i = 0; i < indent; i++) tabs += opts.TAB;
	  var funcStrArray = obj.toString().split("\n");
	  var str = "";
	  for(var i = 0; i < funcStrArray.length; i++){
		str += ((i==0)?"":tabs) + funcStrArray[i] + "\n";
	  }
	  return str;
	}
	function GetRow(indent, data, isPropertyContent){
	  var tabs = "";
	  for(var i = 0; i < indent && !isPropertyContent; i++) tabs += opts.TAB;
	  if(data != null && data.length > 0 && data.charAt(data.length-1) != "\n")
		data = data+"\n";
	  return tabs+data;                       
	}

	function MakeContentVisible(element, visible){
	  var img = element.previousSibling.firstChild;
	  if(!!img.tagName && img.tagName.toLowerCase() == "img"){
		element.style.display = visible ? 'inline' : 'none';
		element.previousSibling.firstChild.src = visible ? opts.ImgExpanded : opts.ImgCollapsed;
	  }
	}
	function ExpImgClicked(){
	  var container = this.parentNode.nextSibling;
	  if(!container) return;
	  var disp = "none";
	  var src = opts.ImgCollapsed;
	  if(container.style.display == "none"){
		  disp = "inline";
		  src = opts.ImgExpanded;
	  }
	  container.style.display = disp;
	  this.src = src;
	}

	
	if(!opts.indentsize) opts.indentsize = 2;
	var indent = MultiplyString(opts.indentsize || 2, ' ');
	json = forceJSON(json);
	var $html = $('<pre class="code">' + ProcessObject(json, 0, false, false, false) + '</pre>');

	$html.find('img.expand').click(ExpImgClicked);
	
	$(this).html($html);
	
	
}

})(jQuery);