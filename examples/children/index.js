import React from "react";
import ReactDOM from "react-dom";
import { HyperSet, HyperRect, hyperMakeRect, currentTransaction, transformType } from "hyperact";
import { animate } from "../../hyperreact";



const duration = 1.0;
const margin = 8;
const padding = 8;
const dimension = Math.min(128, document.body.offsetWidth - margin - padding); // width & height in px
const unmountedScale = 2;
const mountedScale = 1;



function push(progress) {
	const result = 1 + 0.5 * (1-progress) * Math.sin(progress * Math.PI * 2);
	return Number(result).toFixed(4);
}

function easing(progress) {
	const omega = 10;
	const zeta = 0.8;
	const beta = Math.sqrt(1.0 - zeta * zeta);
	progress = 1 - Math.cos(progress * Math.PI / 2);
	progress = 1 / beta * Math.exp(-zeta * omega * progress) * Math.sin( beta * omega * progress + Math.atan(beta / zeta));
	return 1 - progress;
}

function sortLetters(a,b) {
	return a-b;
}

function frameOfItemAtIndexInWidth(index,width) {
	const containerWidth = width - padding * 2;
	const itemsPerRow = Math.max(1,Math.floor(containerWidth / (dimension + margin)));
	const column = index % itemsPerRow;
	const row = Math.floor(index / itemsPerRow);
	const x = padding + margin + column * (dimension + margin);
	const y = padding + margin + row * (dimension + margin);
	return hyperMakeRect(x, y, dimension, dimension);
}



// const ItemClass = animate(class extends React.Component {
// render() {
// const props = this.props;
const ItemClass = animate( props => {
	const keyCode = props.letter;
	return React.DOM.div({
		className: "letter",
		key:"InnerItem"+keyCode,
		style: {
			position:"absolute",
			left:props.frame.origin.x+"px",
			top: props.frame.origin.y+"px",
			width:props.frame.size.width+"px",
			height:props.frame.size.height+"px",
			fontSize:Math.min(props.frame.size.width, props.frame.size.height)+"px",
			fontFamily:"monospace",
			opacity: props.mounted
		}
	}, String.fromCharCode(keyCode));
// }
},
	{
		frame: function(nu,old,now,target) {
			if (old === null || typeof old === "undefined") old = nu;
			return { // animates a different property in response to a change in this one
				property:"style.transform", // Actually ref.style.transform, no connection to props.style which is ignored. This is confusing.
				type: transformType,
				duration:duration,
				from: "translate3d("+old.origin.x+"px, "+old.origin.y+"px, 0px) scale(1,1) translate3d(0px, 0px, 0px)",
				to: "translate3d("+nu.origin.x+"px, "+nu.origin.y+"px, 0px) scale(1,1) translate3d(0px, 0px, 0px)",
				easing: easing
			}
		},
		mounted: duration,
		NOTmounted: function(nu,old,now,target) {
			if (!old) old = 0;
			let scaleFrom = 1;
			let scaleTo = 1;
			if (nu === 0) scaleTo = 2;
			if (old === 0) scaleFrom = 2;
			if (old === 0 && nu === 0) {
				scaleFrom = 1;
				scaleTo = 1;
			}
			return [
				{
					property:"style.zIndex",
					duration:duration,
					from:-1,
					to:-1,
					additive:false, // default is true
					blend:"absolute" // default is relative
				},
				{
					property:"style.opacity",
					duration:duration,
					from:old,
					to:nu
				}
			];
		},
		zoom: function(nu,old,now,target) {
			if (!old && !nu) nu = 1;
			if (!old) old = nu;
			if (!nu) nu = old;
			const ratio = old/nu;
			const x = target.props.frame.origin.x + target.props.frame.size.width / 2;
			const y = target.props.frame.origin.y + target.props.frame.size.height / 2;
			return { // animates a different property in response to a change in this one
				property:"style.transform", // Actually ref.style.transform, no connection to props.style which is ignored. This is confusing.
				type: transformType,
				duration:duration,
				from: "translate3d("+(-x)+"px, "+(-y)+"px, 0px) scale("+old+","+old+") translate3d("+(x * ratio)+"px, "+(y * ratio)+"px, 0px)",
				to: "translate3d("+(-x)+"px, "+(-y)+"px, 0px) scale("+nu+","+nu+") translate3d("+(x)+"px, "+(y)+"px, 0px)",
				easing: easing
			}
		}
	}
);
const Item = React.createFactory(ItemClass);



const CollectionClass = animate( React.createClass({
	animationForKey: function(key,value,previous,presentation) {
		if (key === "letters") {
			return {
				property: "letters",
				type: new HyperSet(sortLetters), // Have to specify type if not style or number // SetType takes sort function as argument
				duration: duration,
				easing: "step-end"
			};
		}
	},
	render: function() {
		const presentationLetters = this.props.letters;
		const model = this.model;
		const modelLetters = model.letters;
		const currentWidth = this.props.width;
		let modelIndex = 0;
		const children = [];
		const presentationLength = presentationLetters.length;
		for (let presentationIndex = 0; presentationIndex < presentationLength; presentationIndex++) { // The trick is you have to be able to layout all possible items, will be different than the specified/model value
			const keyCode = presentationLetters[presentationIndex];
			const isIn = (modelLetters[modelIndex] === keyCode);
			const frame = frameOfItemAtIndexInWidth(modelIndex, currentWidth); // All item sizes must be equal in this simple example
			children.push( 
				React.createElement(ItemClass, {
					key: "OuterItem"+keyCode,
					letter: keyCode,
					index: modelIndex,
					frame: frame,
					mounted: isIn ? 1 : 0,
					zoom:this.props.zoom,
					scale:this.props.scale
				})
			);
			if (isIn) modelIndex++;
		}
		return React.DOM.div({
			className: "collection"
		}, children);
	}
}));
const Collection = React.createFactory(CollectionClass);



const AppClass = React.createClass({
	getInitialState: function() {
		return { letters:[], zoom: 1, scale: 1 };
	},
	keydown(e) {
		let letters = this.state.letters.slice(0);
		const keyCode = e.keyCode;
		const index = letters.indexOf(keyCode);
		const letter = String.fromCharCode(keyCode);
		let front = [];
		let back = [];
		if (index === -1) { // add
			letters.push(keyCode);
			letters = letters.sort(sortLetters);
		} else { // subtract
			front = this.state.letters.slice(0,index);
			back = this.state.letters.slice(index+1);
			letters = [].concat(front).concat(back);
		}
		this.setState({ letters: letters });
	},
	resize(e) {
		const newZoom = zoomInner.offsetHeight / zoomOuter.offsetHeight;
		const oldZoom = this.state.zoom;
		this.setState({ zoom: newZoom, scale: newZoom / oldZoom });
	},
	componentDidMount: function() {
		document.addEventListener("keydown", this.keydown);
		window.addEventListener('resize',this.resize);
	},
	componentWillUnmount: function() {
		window.removeEventListener('resize',this.resize);
		document.removeEventListener("keydown", this.keydown);
	},
	render: function() {
		return Collection({
			letters: this.state.letters,
			width:document.body.offsetWidth,
			zoom:this.state.zoom,
			scale:this.state.scale
		});
	}
});
const App = React.createFactory(AppClass);



const zoomOuter = document.getElementById("zoomOuter");
const zoomInner = document.getElementById("zoomInner");
zoomInner.style.width = zoomOuter.offsetWidth + "px";
zoomInner.style.height = zoomOuter.offsetHeight + "px";



ReactDOM.render(App({
}), document.getElementById("root"));