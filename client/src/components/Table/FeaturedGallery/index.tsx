import React from "react";

import useParticipants from "../../../twilio/hooks/useParticipants/useParticipants";
import { ITournamentPlayer, IGame, PlayerRole } from "../../../engine/types";
import { isPlayerTabled } from "../../../engine";
import useRoomState from "../../../twilio/hooks/useRoomState/useRoomState";
import "./FeaturedGallery.css";
import SeatVideo from "../../Seat/SeatVideo";
import { useAppState } from "../../../twilio/state";
import useGameType from "../../../hooks/useGameType";
import { MiscOverrides } from "../../../theme";

const playerRoleRanks = {
  [PlayerRole.Featured]: 1,
  [PlayerRole.Organizer]: 2,
  [PlayerRole.Player]: 3,
  [PlayerRole.Observer]: 4,
};
const comparePlayerRoles = (roleA: PlayerRole, roleB: PlayerRole) => playerRoleRanks[roleA] - playerRoleRanks[roleB];

const miscOverrides = MiscOverrides[window.location.hostname];
const logoUrl = miscOverrides ? miscOverrides.logoDark : "/logo.png";

function FeaturedPlayer({
  position,
  playerId,
  currentUserId,
}: {
  position: string;
  playerId: string;
  currentUserId?: string;
}) {
  return (
    <div className={`player seat ${position}`}>
      <div
        className="video-progress"
        style={{
          backgroundImage: `url(${logoUrl})`,
        }}
      >
        <SeatVideo
          playerId={playerId}
          currentUserId={currentUserId}
          volume={1}
          hideAudioLevels
        />
      </div>
      <svg viewBox="0 0 500 500">
        <path
          id="curve"
          d="M73.2,148.6c4-6.1,65.5-96.8,178.6-95.6c111.3,1.2,170.8,90.3,175.1,97"
        />
        <text width="500">
          <textPath xlinkHref="#curve">Featured Guest</textPath>
        </text>
      </svg>
    </div>
  );
}

function FeaturedGallery({
  game,
  players,
}: {
  game: IGame;
  players: { [key: string]: ITournamentPlayer };
}) {
  const { mockFeaturedParticipants } = useGameType();
  const participants = useParticipants();
  const { user } = useAppState();
  const observingParticipants = participants
    .filter(
      (p) =>
        players[p.identity] &&
        (!game.players[p.identity] ||
          !isPlayerTabled(game, game.players[p.identity]))
    )
    .map((p) => players[p.identity])
    .sort((p1, p2) => comparePlayerRoles(p1.role, p2.role))
    .filter((p) => p.role === PlayerRole.Featured); // If we turn this off, does the disconnect work?

  if (
    user?.uid &&
    players[user.uid] &&
    players[user.uid].role === PlayerRole.Featured
  ) {
    observingParticipants.push(players[user.uid]);
  }
  return (
    <div className="featured-gallery">
      <div className="featured-gallery-container">
        {mockFeaturedParticipants && (
          <>
            <FeaturedPlayer
              position="p9"
              currentUserId={user?.uid}
              playerId="mock1"
            />
          </>
        )}
        {observingParticipants.map((player, index) => (
          <FeaturedPlayer
            position={`p${9 + index}`}
            currentUserId={user?.uid}
            playerId={player.id}
          />
        ))}
      </div>
    </div>
  );
}

export default function ConnectedFeaturedGallery({
  game,
  players,
}: {
  game: IGame;
  players: { [key: string]: ITournamentPlayer };
}) {
  const roomState = useRoomState();
  return roomState === "connected" || true ? (
    <FeaturedGallery game={game} players={players} />
  ) : null;
}
