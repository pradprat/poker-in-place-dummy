import React from "react";
import PropTypes from "prop-types";

import "./Deck.css";
import Card from "../Card";

const safeGet = (array, index, defaultValue) => {
  if (array && index < array.length) {
    return array[index];
  }
  return defaultValue;
};
function Deck(props) {
  return (
    <div className="deck">
      <div className="stack">
        <Card height={props.height} visible={false} card="1B" isStack />
      </div>
      <div className="flop">
        <Card
          height={props.height}
          visible
          card={safeGet(props.flop, 0)}
          placeholder={!props.flop}
          isStack
        />
        <Card
          height={props.height}
          visible
          card={safeGet(props.flop, 1)}
          placeholder={!props.flop}
          isStack
        />
        <Card
          height={props.height}
          visible
          card={safeGet(props.flop, 2)}
          placeholder={!props.flop}
          isStack
        />
      </div>
      <div className="turn">
        <Card
          height={props.height}
          visible
          card={safeGet(props.turn, 0)}
          placeholder={!props.turn}
          isStack
        />
      </div>
      <div className="river">
        <Card
          height={props.height}
          visible
          card={safeGet(props.river, 0)}
          placeholder={!props.river}
        />
      </div>
    </div>
  );
}

// TODO: move to interface
Deck.propTypes = {
  height: PropTypes.string,
  flop: PropTypes.arrayOf(PropTypes.string),
  turn: PropTypes.arrayOf(PropTypes.string),
  river: PropTypes.arrayOf(PropTypes.string),
};

export default React.memo(Deck);
