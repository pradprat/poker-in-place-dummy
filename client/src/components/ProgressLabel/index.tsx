/* Adapted from https://github.com/swiftcarrot/react-progress-label */
import React from "react";
import { makeStyles, createStyles, Theme } from "@material-ui/core";

function getPoint(r: number, degree: number, size: number, dy: number) {
  const d = (degree / 180) * Math.PI;

  return {
    x: r * Math.sin(d) + size / 2,
    y: r * (1 - Math.cos(d)) + dy,
  };
}

interface IProps {
  startDegree?: number;
  progress?: number;
  progressWidth?: number;
  trackWidth?: number;
  trackBorderWidth?: number;
  trackBorderColor?: string;// "#0000ff",
  cornersWidth?: number;
  size?: number;
  fillColor?: string;
  trackColor?: string;
  progressColor?: string;
  components?: {
    Svg: any;
    Path: any;
    Circle: any;
    Text: any;
  };
  text?: string;
  textProps?: any;
  className?: string;
}

const ProgressLabel = ({
  components: { Svg, Circle, Path, Text },
  progress,
  progressWidth,
  progressColor,
  trackWidth,
  trackBorderWidth,
  trackBorderColor,
  cornersWidth,
  fillColor,
  trackColor,
  startDegree,
  size,
  text,
  textProps,
  className,
  ...props
}: IProps) => {
  const size2 = size / 2;
  const cx = size2;
  const cy = cx;
  const dy = trackWidth / 2 + trackBorderWidth;
  const r = size2 - dy;

  const boundedProgress = Math.max(0, Math.min(1, progress));

  const endDegree = startDegree + (boundedProgress * 360);
  const s = getPoint(r, startDegree, size, dy);
  const e = getPoint(r, endDegree, size, dy);

  let progressPath = null;
  if (boundedProgress < 0.5) {
    progressPath = `M ${s.x} ${s.y} A ${r} ${r}, 0, 0, 1, ${e.x},${e.y}`;
  } else {
    const m = getPoint(r, startDegree + 180, size, dy);
    progressPath = `M ${s.x} ${s.y} A ${r} ${r}, 0, 0, 1, ${m.x},${m.y}
        M ${m.x} ${m.y} A ${r} ${r}, 0, 0, 1, ${e.x},${e.y}`;
  }

  const progressStyle = {
    strokeWidth: progressWidth,
    stroke: progressColor,
    fill: "none",
  };

  return (
    <Svg
      {...props}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill={trackColor}
      className={`${className} progress-label`}
    >
      <linearGradient x1="0" y1="0" x2="100%" y2="100%" id="progress-gradient">
        <stop
          className="progress-gradient-start"
          offset="0"
          stopColor={progressColor}
        />
        <stop
          className="progress-gradient-stop"
          offset="100%"
          stopColor={progressColor}
        />
      </linearGradient>
      {trackBorderWidth > 0 ? (
        <Circle
          cx={cx}
          cy={cy}
          r={size2 - trackBorderWidth / 2}
          style={{
            stroke: trackBorderColor,
            strokeWidth: trackBorderWidth,
          }}
        />
      ) : null}

      {trackBorderWidth > 0 ? (
        <Circle
          cx={cx}
          cy={cy}
          r={size2 - trackBorderWidth - trackWidth - trackBorderWidth / 2}
          style={{
            stroke: trackBorderColor,
            strokeWidth: trackBorderWidth,
            fill: fillColor,
          }}
        />
      ) : null}

      {progress > 0 ? <Path d={progressPath} style={progressStyle} /> : null}
      {progress > 0 ? (
        <Circle
          cx={s.x}
          cy={s.y}
          r={cornersWidth}
          fill="url(#progress-gradient)"
        />
      ) : null}
      {progress > 0 ? (
        <Circle
          cx={e.x}
          cy={e.y}
          r={cornersWidth}
          fill="url(#progress-gradient)"
        />
      ) : null}
      {text ? <Text {...textProps}>{text}</Text> : null}
    </Svg>
  );
};

ProgressLabel.defaultProps = {
  startDegree: 0,
  progress: 0,
  progressWidth: 10,
  trackWidth: 20,
  trackBorderWidth: 0,
  trackBorderColor: "#0000ff",
  cornersWidth: 5,
  size: 128 * 1.2,
  fillColor: "#ffffff",
  trackColor: "#ff0000",
  progressColor: "#ce5991",
  components: {
    Svg: "svg",
    Path: "path",
    Circle: "circle",
    Text: "text",
  },
};

export default ProgressLabel;
