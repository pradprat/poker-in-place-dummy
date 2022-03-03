import React from "react";
import PropTypes from "prop-types";
import "./Card.css";
import { makeStyles, createStyles, Theme } from "@material-ui/core";

import { MiscOverrides } from "../../theme";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    active: {
      border: `2px solid ${theme.palette.secondary.main}`,
    },
    card: {
      display: "flex",
    },
  })
);

const heightToWidthAspectRatio = 1.3293;
const heightToUnits = (height: string) => {
  const parts = /([\d.]+)(.+)/.exec(height);
  return { size: parseFloat(parts[1]), units: parts[2] };
};

interface IProps {
  height: string;
  className?: string;
  placeholder?: string;
  card: string;
  visible: boolean;
  style?: any;
  isStack?: boolean;
}

const miscOverride = MiscOverrides[window.location.hostname];
const cardBack = miscOverride && miscOverride.cardBack ? miscOverride.cardBack : "/cards/1B.png";
function Card(props: IProps) {
  const classes = useStyles();
  const cardHeightUnits = heightToUnits(props.height);
  const width = cardHeightUnits.size / heightToWidthAspectRatio;
  const [flipped, setFlipped] = React.useState(false);

  React.useEffect(() => {
    setFlipped(!props.placeholder && props.visible && props.card !== "1B");
    return () => setFlipped(false);
  }, [props.visible, props.card, props.placeholder]);

  const isBack = !flipped || props.card === "1B";

  return (
    <div
      id={(props.card || "").toUpperCase()}
      className={`card ${classes.card} ${props.className || ""} ${
        props.className === "active" ? classes.active : ""
      } ${props.placeholder ? "placeholder" : ""} flipper-tile`}
      style={{
        width: `${width}${cardHeightUnits.units}`,
        height: props.height,
        // padding: 1,
        ...props.style,
      }}
    >
      <div
        className={`flipper-tilewrap ${flipped ? "flipped" : ""}${
          isBack ? "card-back" : ""
        }`}
      >
        {!props.placeholder && (
          <img
            className="flipper-tilefront"
            alt={props.card}
            src={cardBack}
            style={{
              width: `${width}${cardHeightUnits.units}`,
              height: props.height,
            }}
          />
        )}
        {!props.placeholder && props.visible && (
          <img
            className="flipper-tileback"
            alt={props.card}
            src={isBack ? cardBack : `/cards/${props.card.toUpperCase()}.png`}
            style={{
              width: "100%", // `${width}${cardHeightUnits.units}`,
              height: "100%", // props.height,
            }}
          />
        )}
      </div>
    </div>
  );
}

// TODO: move to interface
Card.propTypes = {
  card: PropTypes.string,
  className: PropTypes.string,
  height: PropTypes.string,
  visible: PropTypes.bool.isRequired,
  style: PropTypes.object,
  placeholder: PropTypes.bool,
};

Card.defaultProps = {
  card: "1B",
  visible: false,
  height: "100px",
  placeholder: false,
  style: {},
};

export default React.memo(Card);
