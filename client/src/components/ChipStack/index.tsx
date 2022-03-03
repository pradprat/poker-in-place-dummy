import React from "react";
import PropTypes from "prop-types";
import "./ChipStack.css";
import { makeStyles, createStyles, Theme } from "@material-ui/core";
import { CSSProperties } from "@material-ui/core/styles/withStyles";

import { GameType } from "../../engine/types";
import { toCurrency } from "../../engine/utils";
import useGameType from "../../hooks/useGameType";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    active: {
      border: `2px solid ${theme.palette.secondary.main}`,
    },
    card: {},
  })
);

const heightToWidthAspectRatio = 1.3293;
const heightToUnits = (height: string) => {
  const parts = /([\d.]+)(.+)/.exec(height);
  return { size: parseFloat(parts[1]), units: parts[2] };
};

interface IProps {
  height?: string;
  className?: string;
  style?: any;
  value: number;
  startingValue: number;
  animateIntoPot?: boolean;
  lastAction?: string;
  onAnimationComplete?: { (): void };
}

interface IChip {
  color: string;
}

const colors = ["black", "orange", "red", "blue", "green"];

function ChipStack(props: IProps) {
  const classes = useStyles();
  const { gameType } = useGameType();
  const [animatedStyle, setAnimatedStyle] = React.useState<CSSProperties>(null);

  const formatCurrency = (num: number) => {
    if (gameType === GameType.Cash) {
      return `$${toCurrency(num)}`;
    }
    return `$${toCurrency(num)}`;
  };

  const increments = [
    props.startingValue * 500, // 50
    props.startingValue * 100, // 10
    props.startingValue * 20, // 2
    props.startingValue * 5, // 0.5
    props.startingValue, // 0.1
  ];

  let value = props.value;
  const rows: IChip[][] = [];
  for (let i = 0; i < increments.length; ++i) {
    if (value > increments[i]) {
      const count = Math.min(8, Math.floor(value / increments[i]));
      value -= count * increments[i];
      rows.push([]);
      for (let j = 0; j < count; ++j) {
        rows[rows.length - 1].push({ color: colors[i] });
      }
    }
  }

  const chipstackRef = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    if (props.animateIntoPot) {
      // calculate the offsets here to the center of the pot
      if (chipstackRef.current) {
        if (animatedStyle) {
          // debugger;
        } else {
          // chipstackRef.current.offsetLeft;
          const potSize = document.getElementById("potSize");
          if (potSize) {
            const potRect = potSize.getBoundingClientRect();
            const rect = chipstackRef.current.getBoundingClientRect();
            setAnimatedStyle({
              marginLeft: 0,
              marginRight: 0,
              marginTop: 0,
              marginBottom: 0,
              position: "fixed",
              left: rect.x,
              top: rect.y,
            });
            setTimeout(() => {
              setAnimatedStyle({
                marginLeft: 0,
                marginRight: 0,
                marginTop: 0,
                marginBottom: 0,
                position: "fixed",
                left: rect.x,
                top: rect.y,
                transform: `translate(${potRect.x - rect.x}px, ${
                  potRect.y - rect.y
                }px) scale3d(0,0,0)`,
                transition: "all 0.5s ease",
              });
              setTimeout(props.onAnimationComplete, 1000);
            }, 100);
          }
        }
      }
    }
  }, [props.animateIntoPot, chipstackRef.current]);

  const lastAction = props.lastAction ? `${props.lastAction} ` : ""

  return (
    <div
      id="chipstack"
      className={`${classes.card} chipstack`}
      ref={chipstackRef}
      style={animatedStyle}
    >
      <div className="rows">
        {rows.map((r, index) => (
          <div className="row" key={index}>
            {r.map(({ color }, subIndex) => (
              <div key={`${color}${subIndex}`} className={`pokerchip ${color} iso`} />
            ))}
          </div>
        ))}
      </div>
      <div className="amount">
        <span className="amount-action">{lastAction}</span>
        <span className="amount-amount">
          {props.value ? formatCurrency(props.value) : ""}
        </span>
      </div>
    </div>
  );
}

// TODO: move to interface
ChipStack.propTypes = {
  card: PropTypes.string,
  className: PropTypes.string,
  height: PropTypes.string,
  visible: PropTypes.bool.isRequired,
  style: PropTypes.object,
  placeholder: PropTypes.bool,
};

ChipStack.defaultProps = {
  card: "1B",
  visible: false,
  height: "100px",
  placeholder: false,
  style: {},
};

export default ChipStack;
