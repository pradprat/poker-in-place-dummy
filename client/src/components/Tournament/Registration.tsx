import React, { useState, useEffect } from "react";
import { TwilioError } from "twilio-video";
import { useParams } from "react-router-dom";
import {
  Container as MaterialContainer,
  TextField,
  Grid,
  Button,
} from "@material-ui/core";
import firebase from "firebase";
import { styled } from "@material-ui/core/styles";

import "./Tournament.css";
import "./Registration.css";
import Header from "../Header";
import { useAppState } from "../../twilio/state";
import {
  IGame,
  IHand,
  ITournamentDetails,
  ITournamentRegistration,
} from "../../engine/types";
import { callFirebaseTournamentFunctionWithJson } from "../../firebase/rest";
import IURLTournamentIDParams from "../../types/IURLTournamentIDParams";

const Container = styled("div")({});

function FirebaseTournament() {
  const { URLTournamentID } = useParams<IURLTournamentIDParams>();
  const [tournament, setTournament] = useState<ITournamentDetails>(null);
  const [tables] = useState<IGame[]>([]);
  const [registrations, setRegistrations] = useState<ITournamentRegistration[]>(
    []
  );
  const [activeHands] = useState<IHand[]>([]);
  const { user, setError } = useAppState();
  const [autoAdvanceTimeout] = useState<NodeJS.Timeout>();

  const autoAdvanceTimeoutRef = React.useRef(autoAdvanceTimeout);
  autoAdvanceTimeoutRef.current = autoAdvanceTimeout;

  const activeHandsRef = React.useRef(activeHands);
  activeHandsRef.current = activeHands;

  const tablesRef = React.useRef(tables);
  tablesRef.current = tables;

  useEffect(() => {
    if (user) {
      try {
        const tournamentDoc = firebase
          .firestore()
          .collection("tournaments")
          .doc(URLTournamentID);
        const unwatchTournament = tournamentDoc.onSnapshot(
          (tournamentSnapshot) => {
            setTournament(tournamentSnapshot.data() as ITournamentDetails);
          },
          (error) => {
            console.error(error);
            setError({ message: "Error Loading Tournament" } as TwilioError);
          }
        );
        const unwatchRegistrations = tournamentDoc
          .collection("registrants")
          .onSnapshot(
            (registrations) => {
              setRegistrations(
                registrations.docs.map((r) => ({
                  ...(r.data() as ITournamentRegistration),
                }))
              );
            },
            (error) => {
              console.error(error);
            }
          );
        return () => {
          unwatchTournament();
          unwatchRegistrations();
        };
      } catch (e) {
        console.log(e);
      }
    }
    return () => {};
  }, [user, URLTournamentID, setError]);

  return (
    <Tournament
      tournament={tournament}
      registrations={registrations}
      tournamentId={URLTournamentID}
    />
  );
}

interface ITournamentProps {
  tournament?: ITournamentDetails;
  registrations: ITournamentRegistration[];
  tournamentId: string;
}

export function Tournament(props: ITournamentProps) {
  const { user, setError } = useAppState();

  const [name, setName] = useState(user.displayName);
  const [venmo, setVenmo] = useState("");
  const [paypal, setPaypal] = useState("");
  const [phone, setPhone] = useState("");
  const [registration, setRegistration] = useState<any>(null);
  const [email, setEmail] = useState(user.email);
  const [isSaving, setIsSaving] = useState(false);

  const { tournament, registrations, tournamentId } = props;

  useEffect(() => {
    if (tournamentId) {
      const tournamentWatch = firebase
        .firestore()
        .collection("tournaments")
        .doc(tournamentId)
        .collection("registrants")
        .doc(user.uid)
        .onSnapshot((registration) => {
          setRegistration(registration.exists ? registration.data() : null);
        });

      return () => tournamentWatch();
    }
  }, [tournamentId, isSaving, user]);

  const onCompleteRegistration = async () => {
    setIsSaving(true);
    await callFirebaseTournamentFunctionWithJson(
      "tournament/register",
      {
        name,
        venmo,
        paypal,
        phone,
        email,
      },
      () => user!.getIdToken(),
      () => tournament?.apiServerHost,
      tournamentId,
      setError
    );
    setIsSaving(false);
  };

  const onEnrollRegistrants = async () => {
    setIsSaving(true);
    await callFirebaseTournamentFunctionWithJson(
      "tournament/enroll",
      {},
      () => user!.getIdToken(),
      () => tournament?.apiServerHost,
      tournamentId,
      setError
    );
    setIsSaving(false);
  };

  return (
    <Container className="registration">
      <Header mobileModeEnabled={false} />
      <MaterialContainer maxWidth="sm" style={{ marginTop: "5%" }}>
        {!tournament && <div className="loading">Loading...</div>}
        {tournament && (
          <>
            <div className="hero">
              <img
                src={tournament.branding.registrationImageUrl}
                alt={tournament.name}
              />
              <h2>Register for {tournament.name}</h2>
            </div>
            {registration ? (
              <div className="complete">
                <h2>You're all set!</h2>
                <div>
                  If you plan on joining from a different device, write down
                  this code to join:
                </div>
                <h1 className="code">{registration.code}</h1>
              </div>
            ) : (
              <>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      margin="dense"
                      id="name"
                      fullWidth
                      label="Displayed Name"
                      type="text"
                      style={{ fontSize: 40 }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      value={name}
                      onChange={(ev) => setName(ev.currentTarget.value)}
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      margin="dense"
                      id="name"
                      fullWidth
                      label="Email address"
                      type="string"
                      style={{ fontSize: 40 }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      value={email}
                      onChange={(ev) => setEmail(ev.currentTarget.value)}
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      margin="dense"
                      id="phone"
                      fullWidth
                      label="Phone number"
                      type="phone"
                      style={{ fontSize: 40 }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      value={phone}
                      onChange={(ev) => setPhone(ev.currentTarget.value)}
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      margin="dense"
                      id="name"
                      fullWidth
                      label="Venmo Handle (for payments)"
                      type="string"
                      style={{ fontSize: 40 }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      value={venmo}
                      onChange={(ev) => setVenmo(ev.currentTarget.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      margin="dense"
                      id="name"
                      fullWidth
                      label="Paypal Handle (for payments)"
                      type="string"
                      style={{ fontSize: 40 }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      value={paypal}
                      onChange={(ev) => setPaypal(ev.currentTarget.value)}
                    />
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  color="primary"
                  style={{ margin: "1rem 0" }}
                  size="large"
                  fullWidth
                  onClick={onCompleteRegistration}
                >
                  Complete Registration
                </Button>
              </>
            )}
            {tournament.organizerId === user.uid && (
              <div>
                <h1>Registrants</h1>
                <div className="registrants">
                  {registrations.map((r) => (
                    <div
                      className={`${r.enrolled ? "enrolled" : "unenrolled"} ${
                        r.joined ? "joined" : ""
                      }`}
                    >
                      <div className="name">
                        <div>
                          {r.name} ({r.email})
                        </div>
                        <div>
                          {r.enrolled ? "enrolled " : ""}
                          {r.joined ? "joined " : ""}
                        </div>
                      </div>
                      <div className="created">
                        {new Date(r.created).toLocaleDateString()}
                      </div>
                      <div className="code">{r.code}</div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="contained"
                  color="primary"
                  style={{ margin: "1rem 0" }}
                  size="large"
                  fullWidth
                  onClick={onEnrollRegistrants}
                >
                  Enroll Registrants
                </Button>
              </div>
            )}
          </>
        )}
      </MaterialContainer>
    </Container>
  );
}

export default FirebaseTournament;
