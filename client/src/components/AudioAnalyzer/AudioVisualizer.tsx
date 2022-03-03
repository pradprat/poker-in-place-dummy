import React, { createRef, useEffect } from "react";

interface IProps {
  audioData: any;
}

function AudioVisualizer(props: IProps) {
  const canvasRef = createRef<HTMLCanvasElement>();

  useEffect(() => {
    const { audioData } = props;
    const canvas = canvasRef.current;
    const height = canvas.height;
    const width = canvas.width;
    const context = canvas.getContext("2d");
    let x = 0;
    const sliceWidth = (width * 1.0) / audioData.length;

    context.lineWidth = 2;
    context.strokeStyle = "#ffffff";
    context.clearRect(0, 0, width, height);

    context.beginPath();
    context.moveTo(0, height / 2);
    for (const item of audioData) {
      const y = (item / 255.0) * height;
      context.lineTo(x, y);
      x += sliceWidth;
    }
    context.lineTo(x, height / 2);
    context.stroke();
  }, [props.audioData, canvasRef]);

  return (
    <canvas width="600" height="50" ref={canvasRef} style={{ width: "100%" }} />
  );
}

// class AudioVisualiser extends Component {
//   constructor(props) {
//     super(props);
//     this.canvas = React.createRef();
//   }

//   componentDidUpdate() {
//     this.draw();
//   }

//   draw() {
//     const { audioData } = this.props;
//     const canvas = this.canvas.current;
//     const height = canvas.height;
//     const width = canvas.width;
//     const context = canvas.getContext("2d");
//     let x = 0;
//     const sliceWidth = (width * 1.0) / audioData.length;

//     context.lineWidth = 2;
//     context.strokeStyle = "#000000";
//     context.clearRect(0, 0, width, height);

//     context.beginPath();
//     context.moveTo(0, height / 2);
//     for (const item of audioData) {
//       const y = (item / 255.0) * height;
//       context.lineTo(x, y);
//       x += sliceWidth;
//     }
//     context.lineTo(x, height / 2);
//     context.stroke();
//   }

//   render() {
//     return <canvas width="300" height="300" ref={this.canvas} />;
//   }
// }

export default AudioVisualizer;
