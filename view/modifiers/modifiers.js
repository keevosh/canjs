steal('can/view', function(){
	
	//---- ADD jQUERY HELPERS -----
	//converts jquery functions to use views	
	var convert, modify, isTemplate, isHTML, isDOM, getCallback,
		// text and val cannot produce an element, so don't run hookups on them
		noHookup = {'val':true,'text':true};

	convert = function( func_name ) {
		// save the old jQuery helper
		var old = can.prototype[func_name];

		// replace it wiht our new helper
		can.prototype[func_name] = function() {
			
			var args = can.makeArray(arguments),
				callbackNum, 
				callback, 
				self = this,
				result;
			
			// if the first arg is a deferred
			// wait until it finishes, and call
			// modify with the result
			if ( can.isDeferred(args[0]) ) {
				args[0].done(function( res ) {
					modify.call(self, [res], old);
				})
				return this;
			}
			//check if a template
			else if ( isTemplate(args) ) {

				// if we should operate async
				if ((callbackNum = getCallback(args))) {
					callback = args[callbackNum];
					args[callbackNum] = function( result ) {
						modify.call(self, [result], old);
						callback.call(self, result);
					};
					can.view.apply(can.view, args);
					return this;
				}
				// call view with args (there might be deferreds)
				result = can.view.apply(can.view, args);
				
				// if we got a string back
				if (!can.isDeferred(result) ) {
					// we are going to call the old method with that string
					args = [result];
				} else {
					// if there is a deferred, wait until it is done before calling modify
					result.done(function( res ) {
						modify.call(self, [res], old);
					})
					return this;
				}
			}
			return noHookup[func_name] ? old.apply(this,args) : 
				modify.call(this, args, old);
		};
	};

	// modifies the content of the element
	// but also will run any hookup
	modify = function( args, old ) {
		var res, stub, hooks;

		//check if there are new hookups
		for ( var hasHookups in can.view.hookups ) {
			break;
		}

		//if there are hookups, turn into a frag
		// and insert that
		// by using a frag, the element can be recursively hooked up
		// before insterion
		if ( hasHookups && args[0] && isHTML(args[0]) ) {
			args[0] = can.view.frag(args[0])
		}
	
		//then insert into DOM
		res = old.apply(this, args);

		return res;
	};

	// returns true or false if the args indicate a template is being used
	// can.$('#foo').html('/path/to/template.ejs',{data})
	// in general, we want to make sure the first arg is a string
	// and the second arg is data
	isTemplate = function( args ) {
		// save the second arg type
		var secArgType = typeof args[1];
		
		// the first arg is a string
		return typeof args[0] == "string" && 
				// the second arg is an object or function
		       (secArgType == 'object' || secArgType == 'function') && 
			   // but it is not a dom element
			   !isDOM(args[1]);
	};
	// returns true if the arg is a jQuery object or HTMLElement
	isDOM = function(arg){
		return arg.nodeType || (arg[0] && arg[0].nodeType)
	};
	// returns whether the argument is some sort of HTML data
	isHTML = function( arg ) {
		if ( isDOM(arg) ) {
			// if jQuery object or DOM node we're good
			return true;
		} else if ( typeof arg === "string" ) {
			// if string, do a quick sanity check that we're HTML
			arg = can.trim(arg);
			return arg.substr(0, 1) === "<" && arg.substr(arg.length - 1, 1) === ">" && arg.length >= 3;
		} else {
			// don't know what you are
			return false;
		}
	};

	//returns the callback arg number if there is one (for async view use)
	getCallback = function( args ) {
		return typeof args[3] === 'function' ? 3 : typeof args[2] === 'function' && 2;
	};

	/**
	 *  @add can.prototype
	 *  @parent can.View
	 *  Called on a can collection that was rendered with can.View with pending hookups.  can.View can render a 
	 *  template with hookups, but not actually perform the hookup, because it returns a string without actual DOM 
	 *  elements to hook up to.  So hookup performs the hookup and clears the pending hookups, preventing errors in 
	 *  future templates.
	 *  
	 * @codestart
	 * can.$(can.View('//views/recipes.ejs',recipeData)).hookup()
	 * @codeend
	 */
	can.prototype.hookup = function() {
		can.view.frag(this);
		return this;
	};

	/**
	 *  @add can.prototype
	 */
	can.each([
	/**
	 *  @function prepend
	 *  @parent can.View
	 *  
	 *  Extending the original [http://api.jquery.com/prepend/ jQuery().prepend()]
	 *  to render [can.View] templates inserted at the beginning of each element in the set of matched elements.
	 *  
	 *  	can.$('#test').prepend('path/to/template.ejs', { name : 'javascriptmvc' });
	 *  
	 *  @param {String|Object|Function} content A template filename or the id of a view script tag 
	 *  or a DOM element, array of elements, HTML string, or can object.
	 *  @param {Object} [data] The data to render the view with.
	 *  If rendering a view template this parameter always has to be present
	 *  (use the empty object initializer {} for no data).
	 */
	"prepend",
	/**
	 *  @function append
	 *  @parent can.View
	 *  
	 *  Extending the original [http://api.jquery.com/append/ jQuery().append()]
	 *  to render [can.View] templates inserted at the end of each element in the set of matched elements.
	 *  
	 *  	can.$('#test').append('path/to/template.ejs', { name : 'javascriptmvc' });
	 *  
	 *  @param {String|Object|Function} content A template filename or the id of a view script tag 
	 *  or a DOM element, array of elements, HTML string, or can object.
	 *  @param {Object} [data] The data to render the view with.
	 *  If rendering a view template this parameter always has to be present
	 *  (use the empty object initializer {} for no data).
	 */
	"append",
	/**
	 *  @function after
	 *  @parent can.View
	 *  
	 *  Extending the original [http://api.jquery.com/after/ jQuery().after()]
	 *  to render [can.View] templates inserted after each element in the set of matched elements.
	 *  
	 *  	can.$('#test').after('path/to/template.ejs', { name : 'javascriptmvc' });
	 *  
	 *  @param {String|Object|Function} content A template filename or the id of a view script tag 
	 *  or a DOM element, array of elements, HTML string, or can object.
	 *  @param {Object} [data] The data to render the view with.
	 *  If rendering a view template this parameter always has to be present
	 *  (use the empty object initializer {} for no data).
	 */
	"after",
	/**
	 *  @function before
	 *  @parent can.View
	 *  
	 *  Extending the original [http://api.jquery.com/before/ jQuery().before()]
	 *  to render [can.View] templates inserted before each element in the set of matched elements.
	 *  
	 *  	can.$('#test').before('path/to/template.ejs', { name : 'javascriptmvc' });
	 *  
	 *  @param {String|Object|Function} content A template filename or the id of a view script tag 
	 *  or a DOM element, array of elements, HTML string, or can object.
	 *  @param {Object} [data] The data to render the view with.
	 *  If rendering a view template this parameter always has to be present
	 *  (use the empty object initializer {} for no data).
	 */
	"before",
	/**
	 *  @function text
	 *  @parent can.View
	 *  
	 *  Extending the original [http://api.jquery.com/text/ jQuery().text()]
	 *  to render [cac.View] templates as the content of each matched element.
	 *  Unlike [can.prototype.html] can.prototype.text also works with XML, escaping the provided
	 *  string as necessary.
	 *  
	 *  	can.$('#test').text('path/to/template.ejs', { name : 'javascriptmvc' });
	 *  
	 *  @param {String|Object|Function} content A template filename or the id of a view script tag 
	 *  or a DOM element, array of elements, HTML string, or can object.
	 *  @param {Object} [data] The data to render the view with.
	 *  If rendering a view template this parameter always has to be present
	 *  (use the empty object initializer {} for no data).
	 */
	"text",
	/**
	 *  @function html
	 *  @parent can.View
	 *  
	 *  Extending the original [http://api.jquery.com/html/ jQuery().html()]
	 *  to render [can.View] templates as the content of each matched element.
	 *  
	 *  	can.$('#test').html('path/to/template.ejs', { name : 'javascriptmvc' });
	 *  
	 *  @param {String|Object|Function} content A template filename or the id of a view script tag 
	 *  or a DOM element, array of elements, HTML string, or can object.
	 *  @param {Object} [data] The data to render the view with.
	 *  If rendering a view template this parameter always has to be present
	 *  (use the empty object initializer {} for no data).
	 */
	"html",
	/**
	 *  @function replaceWith
	 *  @parent can.View
	 *  
	 *  Extending the original [http://api.jquery.com/replaceWith/ jQuery().replaceWith()]
	 *  to render [can.View] templates replacing each element in the set of matched elements.
	 *  
	 *  	can.$('#test').replaceWith('path/to/template.ejs', { name : 'javascriptmvc' });
	 *  
	 *  @param {String|Object|Function} content A template filename or the id of a view script tag 
	 *  or a DOM element, array of elements, HTML string, or can object.
	 *  @param {Object} [data] The data to render the view with.
	 *  If rendering a view template this parameter always has to be present
	 *  (use the empty object initializer {} for no data).
	 */
	"replaceWith", "val"],function(i, func){
		convert(func);
	});
})