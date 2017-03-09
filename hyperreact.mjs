import React from 'react';
import { activate, flushTransaction, typeForStyle } from 'hyperact';

function isFunction(w) {
	// WET
	return w && {}.toString.call(w) === "[object Function]";
}

function activateComponent(InnerComponent, implicitAnimations, initialValues) {
	// TODO: explicitAnimations // TODO: stateless components and (don't handle) fragments
	var propValues = function propValues(props) {
		var values = {};
		var prefix = "style.";
		Object.keys(props).forEach(function (key) {
			if (key === "children") {
				// Opaque. Direct children animation (probably) not possible
				values[key] = props[key];
			}
			if (key !== "animations" && key !== "children") {
				// Opaque. Direct children animation (probably) not possible
				if (key.substring(0, prefix.length) !== prefix) values[key] = props[key];
			}
		});
		return values;
	};

	// 	var applyAnimations = function(arrayOrDict,childInstance) {
	// 		if (Array.isArray(arrayOrDict)) {
	// 			arrayOrDict.forEach( function(animation) {
	// 				childInstance.addAnimation(animation); // addAnimation does not register
	// 			});
	// 		} else if (arrayOrDict) { // TODO: is object check
	// 			Object.keys(arrayOrDict).forEach( function(name) {
	// 				childInstance.addAnimation(arrayOrDict[name],name); // addAnimation does not register
	// 			});
	// 		}
	// 	};

	var processProps = function processProps(props, childInstance) {
		childInstance.layer = props;
		flushTransaction(); // Not sure I like this one, but flushed results would be expected here, for example walking presentationLayer in a collection implementation that has fake set animation.
	};

	function Delegate(component) {
		this.component = component;
	}
	Delegate.prototype = {
		typeForProperty: function typeForProperty(property, value) {
			// called from addAnimation aka the double whammy // FIXME: test value
			var result = false;
			var prefix = "style.";
			if (property.substring(0, prefix.length) === prefix) result = typeForStyle(property.substring(prefix.length));
			return result;
		},
		input: function input(property, prettyValue) {
			// input is fromCSS
			var prefix = "style.";
			var result = prettyValue;
			if (property.substring(0, prefix.length) === prefix) {
				var key = property.substring(prefix.length);
				var type = typeForStyle(key);
				if (prettyValue === null || typeof prettyValue === "undefined") {
					console.log("---> Hyperreact input undefined");
					result = type.zero();
				}
				if (isFunction(type.input)) result = type.input(result);
			}
			if (this.component && isFunction(this.component.input)) result = this.component.input.call(this.component, property, result); // Not as useful because it includes unit suffix. Also unsure about native
			return result;
		},
		output: function output(property, uglyValue) {
			// output is toCSS // value is the ugly value // BUG FIXME: sometimes the pretty value?
			var result = uglyValue;
			var prefix = "style.";
			if (property.substring(0, prefix.length) === prefix) {
				var key = property.substring(prefix.length);
				var type = typeForStyle(key);
				if (uglyValue === null || typeof uglyValue === "undefined") {
					console.log("---> Hyperreact output undefined");
					result = type.zero();
				}
				if (isFunction(type.output)) result = type.output(result); // uglyValue should be ugly but is not ?!
			}
			if (this.component && isFunction(this.component.output)) result = this.component.output.call(this.component, property, result); // Not as useful because it includes unit suffix. Also unsure about native
			return result;
		},
		display: function display() {
			if (this.component && this.component.props.hyperDisplay) {
				this.component.props.hyperDisplay.call(this.component);
			} else if (this.component) {
				this.component.forceUpdate();
			}
		},
		animationForKey: function animationForKey(key, value, previous, presentation) {
			if (key === "style") {
				return null;
			}
			var animation = false;
			var prefix = "style.";
			if (key.substring(0, prefix.length) === prefix) {// No implicit animation for style
				// Do not implicitly animate style. Will ask for animationForKey every tick, not what you want. // You might not need to register
			} else if (isFunction(this.component.animationForKey)) {
				animation = this.component.animationForKey.call(this.component, key, value, previous, presentation);
			}
			if (animation === false || typeof animation === "undefined") {
				if (isFunction(implicitAnimations)) animation = implicitAnimations(key, value, previous, presentation, this.component);else if (implicitAnimations) animation = implicitAnimations[key];
				if (isFunction(animation)) animation = implicitAnimations[key](value, previous, presentation, this.component); // This may allow the best syntax, as long as you don't need a stagger.
			}
			return animation;
		}
	};

	var prepareAnimation = function prepareAnimation(component, delegate) {
		if (typeof initialValues === "undefined" || initialValues === null) initialValues = {};
		var layer = Object.assign({}, initialValues); // no mount animations because no null values
		activate(component, delegate, layer);
		processProps(component.props, component);
		flushTransaction(); // Required: If we are not actually in a transaction, tick will happen immediately with the same time value, preventing a proper presentationLayer from being constructed
	};

	function processElement(element, controller) {
		var props = Object.assign({}, element.props);
		var style = Object.assign({}, props.style);
		var prefix = "style.";
		var layer = controller.layer || {};
		var model = controller.model || controller.props;
		Object.keys(style).forEach(function (key) {
			// if there are changes to style, intercept and apply here.
			var property = prefix + key;
			var type = typeForStyle(key);
			var oldValue = model[property];
			var newValue = style[key];
			if (oldValue !== newValue) {
				// convert to strings and compare. Without isEqual
				if (type.input) layer[property] = type.input(newValue); // could be a problem
				else layer[property] = newValue;
			}
		}.bind(this));
		var presentation = controller.presentation;
		if (presentation) Object.keys(presentation).forEach(function (key, index) {
			if (key.substring(0, prefix.length) === prefix) {
				var property = key.substring(prefix.length);
				var newValue = presentation[key];
				style[property] = newValue;
			}
		});
		props.style = style;
		return React.cloneElement(element, props);
	}

	var Subclass = function (SuperComponent) {
		if (!SuperComponent.prototype || !isFunction(SuperComponent.prototype.render)) return null;
		function Subclass() {
			SuperComponent.prototype.constructor.apply(this, arguments);
			var delegate = new Delegate(this);
			prepareAnimation(this, delegate);
			flushTransaction();
		}
		Subclass.prototype = Object.create(SuperComponent.prototype);
		Subclass.prototype.componentWillUnmount = function () {
			// TODO: remove animations and prepare for release
			if (isFunction(SuperComponent.prototype.componentWillUnmount)) SuperComponent.prototype.componentWillUnmount.apply(this, arguments);
			this.removeAllAnimations();
			flushTransaction();
		};
		Subclass.prototype.render = function render() {
			var resultElement = SuperComponent.prototype.render.call(this);
			return processElement(resultElement, this);
		};

		return Subclass;
	}(InnerComponent);

	var displayName = "AnimateClass";
	var AnimateClass = React.createClass({
		displayName: "AnimateClass",

		mounted: true,
		getInitialState: function getInitialState() {
			return {
				mounted: true,
				hyperDisplay: function () {
					if (this.mounted) this.forceUpdate();
				}.bind(this)
			};
		},
		directChildInstance: null,
		delegate: null,
		componentWillReceiveProps: function componentWillReceiveProps(props) {
			if (!this.directChildInstance) throw new Error("No child instance yet");else processProps(props, this.directChildInstance);
		},
		componentWillMount: function componentWillMount() {
			if (!Subclass) {
				this.delegate = new Delegate(this);
				prepareAnimation(this, this.delegate);
				this.directChildInstance = this;
			}
		},
		componentWillUnmount: function componentWillUnmount() {
			this.mounted = false;
			this.directChildInstance.removeAllAnimations();
			this.directChildInstance = null;
			if (this.delegate) this.delegate.component = null;
			flushTransaction();
		},
		render: function render() {
			var childInstance = this.directChildInstance;
			var presentation = childInstance ? childInstance.presentation : this.props;
			var output = propValues(presentation);
			output.key = displayName;
			if (Subclass) {
				var owner = this;
				var reference = function reference(component) {
					if (component && childInstance && childInstance !== component) {
						throw new Error("TODO: remove animations and release, else this will attempt to activate a second time and break.");
					} else if (component && childInstance !== component) {
						owner.directChildInstance = component;
						// You cannot prepare here, child needs model and presentation layer at first render
					}
				};
				output.ref = reference; // TODO: need to handle/restore original ref if it exists
				output.hyperDisplay = this.state.hyperDisplay;
				var result = React.createElement(Subclass, output);
				return result;
			} else {
				return processElement(InnerComponent(output), this);
			}
		}
	});
	return AnimateClass;
}

export { activateComponent };
