import React, { useState, useEffect } from "react";
import { makeStyles, styled } from "@material-ui/core/styles";
import {
  Container as MaterialContainer,
  TextField,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  Card,
  CardHeader,
  Typography,
} from "@material-ui/core";
import { useStripe } from "@stripe/react-stripe-js";
import firebase from "firebase";

import "./Profile.css";
import Header from "./components/Header";
import { useAppState } from "./twilio/state";
import { IUserDetails, ILoggedInUser } from "./engine/types";
import { callFirebaseGameFunction } from "./firebase/rest";
import { MiscOverrides } from "./theme";

const Container = styled("div")({
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  overflow: "scroll",
  paddingBottom: "10%",
});

const useStyles = makeStyles({
  table: {
    width: "100%",
  },
  card: {
    "&>div:last-child": {
      marginTop: 0,
      alignSelf: "center",
    },
  },
});
interface PricingRadioProps {
  name: string;
  description: string;
  price: number;
}

function StyledRadio(props: PricingRadioProps) {
  const classes = useStyles();

  return (
    <Card variant="outlined" style={{ flex: 1 }}>
      <CardHeader
        avatar={<Radio disableRipple color="default" {...props} />}
        action={<div>${props.price / 100} per month</div>}
        className={classes.card}
        title={props.name}
        subheader={props.description}
      />
      {/* <CardContent>
        <Radio disableRipple color="default" {...props} />
        {props.name}
      </CardContent> */}
    </Card>
  );
}

function getUrlVars() {
  return new URLSearchParams(window.location.search.slice(1));
}

const miscOverrides = MiscOverrides[window.location.hostname];
const tableLogo =
  miscOverrides && miscOverrides.tableLogo
    ? miscOverrides.tableLogo
    : "/images/logotype-white.png";

interface IMultiTableTournamentsProps {
  user: ILoggedInUser;
  userDetails: IUserDetails;
  updateProfile: { (updates: any): Promise<void> };
}

function MultiTableTournaments(props: IMultiTableTournamentsProps) {
  const [tableImageUploading, setTableImageUploading] = useState(false);
  const onUploadFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files[0];
    if (file) {
      const storageRef = firebase.storage().ref();

      const fileExtension = file.type === "image/jpeg" ? "jpg" : "png";
      const tournamentTableRef = storageRef.child(
        `images/tournaments/table-${props.user.uid}.${fileExtension}`
      );
      setTableImageUploading(true);
      tournamentTableRef.put(file).then((snapshot) => {
        snapshot.ref.getDownloadURL().then(async (downloadURL) => {
          await props.updateProfile({ tournamentTableImageUrl: downloadURL });
          setTableImageUploading(false);
        });
      });
    }
  };
  return (
    <div>
      <h2>Multi-table Tournaments</h2>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={5}>
          <label htmlFor="upload-photo">
            <input
              style={{ display: "none" }}
              id="upload-photo"
              name="upload-photo"
              type="file"
              onChange={onUploadFile}
            />

            <Button
              color="secondary"
              variant="contained"
              component="span"
              disabled={tableImageUploading}
            >
              Upload Table Art
            </Button>
          </label>
        </Grid>
        <Grid item xs={7}>
          {props.userDetails.tournamentTableImageUrl ||
            (true && (
              <img
                style={{ width: "150px" }}
                src={props.userDetails.tournamentTableImageUrl || tableLogo}
              />
            ))}
        </Grid>
      </Grid>
    </div>
  );
}

function App() {
  const { user } = useAppState();
  const stripe = useStripe();

  const [userDetails, setUserDetails] = useState<IUserDetails>(
    {} as IUserDetails
  );
  const [name, setName] = useState(user.displayName);
  const [venmo, setVenmo] = useState("");
  const [paypal, setPaypal] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user.email);
  const [product, setProduct] = useState("");
  const [products, setProducts] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const enableFeature = getUrlVars().get("enableFeature");
  useEffect(() => {
    if (user && enableFeature) {
      const [feature, value] = enableFeature.split(",");
      const setting = {
        features: { [feature]: value === undefined ? true : value },
      };
      firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .set(setting, { merge: true })
        .then(() => document.location.assign("/"));
    }
  }, [enableFeature, userDetails]);

  useEffect(() => {
    const paymentSessionId = getUrlVars().get("session_id");
    if (paymentSessionId && (user.email || userDetails.email)) {
      setIsSaving(true);
      callFirebaseGameFunction(
        "products/confirm",
        { paymentSessionId, email: userDetails.email || user.email },
        () => user!.getIdToken(),
        () => null,
        null,
        null
      )
        .then((result) => {
          setSessionId(paymentSessionId);

          setIsSaving(false);
        })
        .catch((e) => {
          setIsSaving(false);
        });
    }
    callFirebaseGameFunction(
      "products",
      {},
      () => user!.getIdToken(),
      () => null,
      null,
      null
    ).then((result) => {
      setProducts(result.products);
    });
  }, [user, userDetails]);
  useEffect(() => {
    const unwatch = firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .onSnapshot((value) => {
        const details = (value.data() || {}) as IUserDetails;
        setVenmo(details.venmoHandle || "");
        setPaypal(details.paypalHandle || "");
        setPhone(details.phone || "");
        setEmail(details.email || user.email);
        setProduct(details.product || "");
        setUserDetails(details);
      });
    return unwatch;
  }, [user, sessionId]);

  const needsToPay = product && product !== userDetails.product;

  const updateProfile = async (updates: any) => {
    firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .set(updates, { merge: true });
  };

  const saveProfile = async () => {
    await firebase.auth().currentUser.updateProfile({ displayName: name });
    await updateProfile({
      venmoHandle: venmo || "",
      paypalHandle: paypal || "",
      email: email || "",
      phone: phone || "",
    });

    if (product !== userDetails.product) {
      setIsSaving(true);
      const result = await callFirebaseGameFunction(
        "products/update",
        {
          price: product
            ? products.find((p) => p.id === product).prices[0].id
            : "",
          email: userDetails.email || user.email,
        },
        () => user!.getIdToken(),
        null,
        null
      );
      if (result.paymentSessionId) {
        await stripe.redirectToCheckout({
          sessionId: result.paymentSessionId,
        });
      } else if (result.product) {
        setProduct(product);
      }

      setIsSaving(false);
    }
  };

  return (
    <Container className="profile">
      <Header mobileModeEnabled={false} />
      <MaterialContainer maxWidth="sm" style={{ marginTop: "5%" }}>
        <h2>Profile Information</h2>
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
        <Grid container spacing={0}>
          <Grid item xs={12}>
            <Typography style={{ margin: "1rem 0" }} variant="subtitle1">
              Payment options:
            </Typography>
            {user.email || userDetails.email ? (
              <RadioGroup
                aria-label="product"
                id="product"
                name="product"
                value={product}
                onChange={(value) => setProduct(value.currentTarget.value)}
                style={{ flex: 1 }}
              >
                {products.map((prod) => (
                  <FormControlLabel
                    key={prod.id}
                    className={prod.id === product ? "selected" : "unselected"}
                    value={prod.id}
                    control={
                      <StyledRadio
                        name={prod.name}
                        description={`${prod.description}`}
                        price={prod.prices[0].price as number}
                      />
                    }
                    label=""
                  />
                ))}
                <FormControlLabel
                  className={!product ? "selected" : "unselected"}
                  value=""
                  control={
                    <StyledRadio
                      name="No subscription"
                      description="No subscription. Pay per game."
                      price={0}
                    />
                  }
                  label=""
                />
              </RadioGroup>
            ) : (
              <Typography variant="body2" style={{ margin: "1rem 0" }}>
                -You must authenticate with email to use subscriptions-
              </Typography>
            )}
          </Grid>
        </Grid>
        <Grid container spacing={0}>
          <Grid item xs={12}>
            <Button
              size="medium"
              color="primary"
              variant={needsToPay ? "contained" : "outlined"}
              onClick={saveProfile}
              disabled={isSaving}
            >
              {needsToPay ? "Save and Pay with Stripe" : "Save"}
            </Button>
          </Grid>
        </Grid>
        {(true ||
          (userDetails &&
            userDetails.features &&
            userDetails.features.multiTableTournaments)) && (
          <MultiTableTournaments
            user={user}
            userDetails={userDetails}
            updateProfile={updateProfile}
          />
        )}
        {/* <iframe
          src="https://b95a834ba15a.ngrok.io/onboarding"
          allow="camera;microphone"
          width="800"
          height="600"
        /> */}
      </MaterialContainer>
    </Container>
  );
}

export default App;
