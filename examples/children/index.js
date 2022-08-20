import React, { Component } from "react";
import ReactDOM from "react-dom";
import { HyperSet, hyperMakeRect, transformType, opacityType, registerAnimatableStyles, activateComponent } from "../../dist/hyperreact.js";

const duration = 1.0;
const margin = 8;
const padding = 8;
const dimension = Math.min(128, document.body.offsetWidth - margin - padding); // width & height in px

registerAnimatableStyles({ // an inconvenience that will eventually allow tree shaking unused animation types
	transform: transformType,
	opacity: opacityType
});

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

const Item = activateComponent( props => {
	const keyCode = props.letter;
	const style = {
		left:props.frame.origin.x+"px",
		top: props.frame.origin.y+"px",
		width:props.frame.size.width+"px",
		height:props.frame.size.height+"px",
		fontSize:Math.min(props.frame.size.width, props.frame.size.height)+"px",
		opacity: props.mounted,
        transform: props.transform
	};

	return (
		<div
			className="letter"
			key={"InnerItem"+keyCode}
			style={style}
		>
			{String.fromCharCode(keyCode)}
		</div>
	);
}, { // second argument to activateComponent allows for functional components (otherwise component should implement animationForKey)
		frame: function(nu,old,now,target) {
            if (old === null || typeof old === "undefined") old = nu;
			return { // animates a different property in response to a change in this one
				property:"transform",
				type: transformType,
				duration:duration,
				from: "translate3d("+old.origin.x+"px, "+old.origin.y+"px, 0px) scale(1,1) translate3d(0px, 0px, 0px)",
				to: "translate3d("+nu.origin.x+"px, "+nu.origin.y+"px, 0px) scale(1,1) translate3d(0px, 0px, 0px)",
				easing: easing
			};
		},
		mounted: duration,
		// mounted: function(nu,old,now,target) {
		// 	if (!old) old = 0;
		// 	return [
		// 		{
		// 			property:"style.zIndex",
		// 			duration:duration,
		// 			from:-1,
		// 			to:-1,
		// 			additive:false, // default is true
		// 			blend:"absolute" // default is relative
		// 		},
		// 		{
		// 			property:"style.opacity",
		// 			duration:duration,
		// 			from:old,
		// 			to:nu
		// 		}
		// 	];
		// },
		zoom: function(nu,old,now,target) {
			if (!old && !nu) nu = 1;
			if (!old) old = nu;
			if (!nu) nu = old;
			const ratio = old/nu;
			const x = target.props.frame.origin.x + target.props.frame.size.width / 2;
			const y = target.props.frame.origin.y + target.props.frame.size.height / 2;
			return { // animates a different property in response to a change in this one
				property:"transform",
				type: transformType,
				duration:duration,
				from: "translate3d("+(-x)+"px, "+(-y)+"px, 0px) scale("+old+","+old+") translate3d("+(x * ratio)+"px, "+(y * ratio)+"px, 0px)",
				to: "translate3d("+(-x)+"px, "+(-y)+"px, 0px) scale("+nu+","+nu+") translate3d("+(x)+"px, "+(y)+"px, 0px)",
				easing: easing
			};
		}
	}
);


const Collection = activateComponent( class extends Component {
	animationForKey(key,value,previous,presentation) {
		if (key === "letters") {
			return {
				property: "letters",
				type: new HyperSet(sortLetters), // Have to specify type if not style or number // SetType takes sort function as argument
				duration: duration,
				easing: "step-end"
			};
		}
	}
	render() {
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
			const frame = frameOfItemAtIndexInWidth(modelIndex, currentWidth); // All item sizes must be equal
			const props = {
				key: "OuterItem"+keyCode,
				letter: keyCode,
				index: modelIndex,
				frame: frame,
				mounted: isIn ? 1 : 0,
				zoom:this.props.zoom,
				scale:this.props.scale
			};
			children.push( <Item {...props} /> );
			if (isIn) modelIndex++;
		}
		return (
			<div className="collection">
				{children}
			</div>
		);
	}
});

const App = class extends Component {
	constructor(props) {
		super(props);
		this.state = {
			letters:[],
			zoom: 1,
			scale: 1,
			keydown: this.keydown.bind(this),
			resize: this.resize.bind(this)
		};
	}
	keydown(e) {
		let letters = this.state.letters.slice(0);
		const keyCode = e.keyCode;
		const index = letters.indexOf(keyCode);
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
	}
	resize(e) {
		const newZoom = zoomInner.offsetHeight / zoomOuter.offsetHeight;
		const oldZoom = this.state.zoom;
		this.setState({ zoom: newZoom, scale: newZoom / oldZoom });
	}
	componentDidMount() {
		document.addEventListener("keydown", this.state.keydown);
		window.addEventListener("resize",this.state.resize);
	}
	componentWillUnmount() {
		window.removeEventListener("resize",this.state.resize);
		document.removeEventListener("keydown", this.state.keydown);
	}
	render() {
		const props = {
			letters: this.state.letters,
			width:document.body.offsetWidth,
			zoom:this.state.zoom,
			scale:this.state.scale
		};
		return (
			<Collection {...props} />
		);
	}
};



const zoomOuter = document.getElementById("zoomOuter");
const zoomInner = document.getElementById("zoomInner");
zoomInner.style.width = zoomOuter.offsetWidth + "px";
zoomInner.style.height = zoomOuter.offsetHeight + "px";



ReactDOM.render(<App />, document.getElementById("root"));
