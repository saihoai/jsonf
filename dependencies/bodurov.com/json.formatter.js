/*
Quick Json Formatter Online 1.0 Copyright (c) 2008-2009 Vladimir Bodurov
http://quickjsonformatter.codeplex.com/
License: The MIT License (MIT)
Copyright (c) 2008 Vladimir Bodurov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
// we need tabs as spaces and not CSS magin-left 
// in order to ratain format when coping and pasing the code
window.SINGLE_TAB = "  ";
window.ImgCollapsed = "dependencies/bodurov.com/images/Collapsed.gif";
window.ImgExpanded = "dependencies/bodurov.com/images/Expanded.gif";
window.QuoteKeys = true;
window.IsCollapsible = true;
window.TAB = window.SINGLE_TAB;

function $id(id){ return document.getElementById(id); }
function IsArray(obj) {
  return obj && 
          typeof obj === 'object' && 
          typeof obj.length === 'number' &&
          !(obj.propertyIsEnumerable('length'));
}
function Process(){
  SetTab();
  var json = $id("RawJson").value;
  var html = "";
  try{
    if(json == "") json = "\"\"";
    var obj = eval("["+json+"]");
    html = ProcessObject(obj[0], 0, false, false, false);
    $id("Canvas").innerHTML = "<PRE class='CodeContainer'>"+html+"</PRE>";
  }catch(e){
    alert("JSON is not well formated:\n"+e.message);
    $id("Canvas").innerHTML = "";
  }
}
function ProcessObject(obj, indent, addComma, isArray, isPropertyContent){
  if(!window.TAB) window.TAB = '    ';  //added by Jeoff Wilks 2010-02-18
  var html = "";
  var comma = (addComma) ? "<span class='Comma'>,</span> " : ""; 
  var type = typeof obj;
  var clpsHtml ="";
  if(IsArray(obj)){
    if(obj.length == 0){
      html += GetRow(indent, "<span class='ArrayBrace'>[ ]</span>"+comma, isPropertyContent);
    }else{
      clpsHtml = window.IsCollapsible ? "<span><img src=\""+window.ImgExpanded+"\" onClick=\"ExpImgClicked(this)\" /></span><span class='collapsible'>" : "";
      html += GetRow(indent, "<span class='ArrayBrace'>[</span>"+clpsHtml, isPropertyContent);
      for(var i = 0; i < obj.length; i++){
        html += ProcessObject(obj[i], indent + 1, i < (obj.length - 1), true, false);
      }
      clpsHtml = window.IsCollapsible ? "</span>" : "";
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
      clpsHtml = window.IsCollapsible ? "<span><img src=\""+window.ImgExpanded+"\" onClick=\"ExpImgClicked(this)\" /></span><span class='collapsible'>" : "";
      html += GetRow(indent, "<span class='ObjectBrace'>{</span>"+clpsHtml, isPropertyContent);
      var j = 0;
      for(var prop in obj){
        var quote = window.QuoteKeys ? "\"" : "";
        html += GetRow(indent + 1, "<span class='PropertyName'>"+quote+prop+quote+"</span>: "+ProcessObject(obj[prop], indent + 1, ++j < numProps, false, true));
      }
      clpsHtml = window.IsCollapsible ? "</span>" : "";
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
  for(var i = 0; i < indent; i++) tabs += window.TAB;
  var funcStrArray = obj.toString().split("\n");
  var str = "";
  for(var i = 0; i < funcStrArray.length; i++){
    str += ((i==0)?"":tabs) + funcStrArray[i] + "\n";
  }
  return str;
}
function GetRow(indent, data, isPropertyContent){
  var tabs = "";
  for(var i = 0; i < indent && !isPropertyContent; i++) tabs += window.TAB;
  if(data != null && data.length > 0 && data.charAt(data.length-1) != "\n")
    data = data+"\n";
  return tabs+data;                       
}
function CollapsibleViewClicked(){
  $id("CollapsibleViewDetail").style.visibility = $id("CollapsibleView").checked ? "visible" : "hidden";
  Process();
}

function QuoteKeysClicked(){
  window.QuoteKeys = $id("QuoteKeys").checked;
  Process();
}

function CollapseAllClicked(){
  EnsureIsPopulated();
  TraverseChildren($id("Canvas"), function(element){
    if(element.className == 'collapsible'){
      MakeContentVisible(element, false);
    }
  }, 0);
}
function ExpandAllClicked(){
  EnsureIsPopulated();
  TraverseChildren($id("Canvas"), function(element){
    if(element.className == 'collapsible'){
      MakeContentVisible(element, true);
    }
  }, 0);
}
function MakeContentVisible(element, visible){
  var img = element.previousSibling.firstChild;
  if(!!img.tagName && img.tagName.toLowerCase() == "img"){
    element.style.display = visible ? 'inline' : 'none';
    element.previousSibling.firstChild.src = visible ? window.ImgExpanded : window.ImgCollapsed;
  }
}
function TraverseChildren(element, func, depth){
  for(var i = 0; i < element.childNodes.length; i++){
    TraverseChildren(element.childNodes[i], func, depth + 1);
  }
  func(element, depth);
}
function ExpImgClicked(img){
  var container = img.parentNode.nextSibling;
  if(!container) return;
  var disp = "none";
  var src = window.ImgCollapsed;
  if(container.style.display == "none"){
      disp = "inline";
      src = window.ImgExpanded;
  }
  container.style.display = disp;
  img.src = src;
}
function CollapseLevel(level){
  EnsureIsPopulated();
  TraverseChildren($id("Canvas"), function(element, depth){
    if(element.className == 'collapsible'){
      if(depth >= level){
        MakeContentVisible(element, false);
      }else{
        MakeContentVisible(element, true);  
      }
    }
  }, 0);
}
function TabSizeChanged(){
  Process();
}
function SetTab(){
  var select = $id("TabSize");
  window.TAB = MultiplyString(parseInt(select.options[select.selectedIndex].value), window.SINGLE_TAB);
}
function EnsureIsPopulated(){
  if(!$id("Canvas").innerHTML && !!$id("RawJson").value) Process();
}
function MultiplyString(num, str){
  var sb =[];
  for(var i = 0; i < num; i++){
    sb.push(str);
  }
  return sb.join("");
}
function SelectAllClicked(){

  if(!!document.selection && !!document.selection.empty) {
    document.selection.empty();
  } else if(window.getSelection) {
    var sel = window.getSelection();
    if(sel.removeAllRanges) {
      window.getSelection().removeAllRanges();
    }
  }

  var range = 
      (!!document.body && !!document.body.createTextRange)
          ? document.body.createTextRange()
          : document.createRange();
  
  if(!!range.selectNode)
    range.selectNode($id("Canvas"));
  else if(range.moveToElementText)
    range.moveToElementText($id("Canvas"));
  
  if(!!range.select)
    range.select($id("Canvas"));
  else
    window.getSelection().addRange(range);
}
