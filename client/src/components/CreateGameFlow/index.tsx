import React, { useState, useEffect } from 'react';
import { makeStyles, styled, createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';
import { TwilioError } from 'twilio-video';
import moment from 'moment';
import { useStripe } from '@stripe/react-stripe-js';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import {
  Button,
  Typography,
  Paper,
  RadioGroup,
  Card,
  CardHeader,
  Radio,
  FormControlLabel,
} from '@material-ui/core';

import {
  GameMode,
  GameType,
  PayType,
  TournamentRegistrationMode,
  IUserDetails,
  IRebuyOptions,
  ITournamentDetails,
  BrandingType,
} from '../../engine/types';
import { useAppState } from '../../twilio/state';
import Header from '../Header';
import './CreateGameFlow.css';
import {
  getMaximumParticipants,
  getMaximumDuration,
  isGameModeSupported,
  getModeCost,
  getModeCostDescription,
} from '../../engine';
import { MiscOverrides, getThemeOverrides } from '../../theme';

import BrandingOptions from './BrandingOptions';
import SchedulingOptions from './SchedulingOptions';
import CashOptions from './CashOptions';
import TournamentOptions, { ICreateTournamentDetails } from './TournamentOptions';
import {
  DEFAULT_REBUY_TIME_IN_SECONDS,
  DEFAULT_ROUND_BREAK_FINAL_REBUY_TIME_IN_SECONDS,
  DEFAULT_ELIMINATION_HANG_TIME_IN_SECONDS,
  DEFAULT_TIMEOUT_IN_SECONDS,
  DEFAULT_MIN_TABLE_SIZE_BEFORE_REBALANCE,
  DEFAULT_ENABLE_PERFORMANT_REBALANCES,
  DEFAULT_ENABLE_PLAYER_WELCOME_VIDEOS,
  DEFAULT_ENABLE_AUTOMATION,
  DEFAULT_LATE_REGISTRATION_TIME_IN_MINUTES,
} from './data';
import { validateVimeoUrl } from './utils';

const miscOverrides = MiscOverrides[window.location.hostname];
const tableLogo =
  miscOverrides && miscOverrides.tableLogo ? miscOverrides.tableLogo : '/images/logotype-white.png';
const leftTableLogo =
  miscOverrides && miscOverrides.leftLogo ? miscOverrides.leftLogo : '/images/logotype-white.png';
const rightTableLogo =
  miscOverrides && miscOverrides.rightLogo ? miscOverrides.rightLogo : '/images/logotype-white.png';
const tournamentLogo =
  miscOverrides && miscOverrides.tournamentLogo
    ? miscOverrides.tournamentLogo
    : '/images/logotype-white.png';

const nextHour = (date = new Date()) => {
  const minutesAfterHour = date.getMinutes();
  return new Date(date.getTime() + (60 - minutesAfterHour) * 1000 * 60);
};

function getUrlVars() {
  return new URLSearchParams(window.location.search.slice(1));
}

const FullPage = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden',
  position: 'relative',
  overflowY: 'auto',
  // paddingBottom: "5vh",
});

const defaultTheme = getThemeOverrides();
const lightOverrides = !miscOverrides?.disableLightMode
  ? {
      palette: {
        ...defaultTheme.palette,
        type: 'light',
        background: { default: '#fafafa', paper: '#ffffff' },
        text: {
          primary: '#222',
          secondary: '#222',
        },
      },
    }
  : {};

const theme = createMuiTheme({
  ...defaultTheme,
  ...lightOverrides,
});

const Container = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 'calc(100vh - 64px)',
  overflow: 'auto',
});

const useStyles = makeStyles(theme => ({
  root: {
    // maxWidth: "800px",
    width: '100vw',
    height: '100vh',
    overflowY: 'auto',
    margin: '0 auto',
    // marginTop: theme.spacing(2),
    '& h4': {
      margin: theme.spacing(2),
    },
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'stretch',
    alignItems: 'stretch',
    padding: '15px',
    background: theme.palette.background.default,
    color: theme.palette.type === 'light' ? theme.palette.common.black : theme.palette.text.primary,
    [theme.breakpoints.down('xs')]: {
      padding: '0',
    },
  },
  stepperContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'stretch',
    alignItems: 'stretch',
    maxWidth: 1200,
    width: '80vw',
    margin: 'auto',
    '& p': {
      textAlign: 'center',
    },
    '& div[class^="MuiInputLabel-outlined"]': {
      pointerEvents: 'auto',
    },
    '& label': {
      pointerEvents: 'auto',
    },
    [theme.breakpoints.down('xs')]: {
      width: '98vw',
    },
  },
  stepperActions: {
    marginTop: theme.spacing(3),
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor:
      theme.palette.type === 'light' ? theme.palette.grey[200] : theme.palette.grey[900],
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 1,
  },
  marginlessLabel: {
    // marginRight: 0,
    // marginLeft: 0,
    textAlign: 'center',
    margin: '20px',
    '& > div': {
      borderWidth: 2,
    },
    '&.selected > div': {
      borderColor: theme.palette.primary.main,
    },
    '& span[class*="MuiCardHeader-title"]': {
      ...theme.typography.h5,
      marginBottom: theme.spacing(3),
    },
    '& div[class^="MuiCardHeader-avatar"]': { display: 'none' },
    '& div[class^="MuiCardHeader-content"]': {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
    },
  },
  products: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginRight: theme.spacing(1),
    paddingLeft: theme.spacing(10),
    paddingRight: theme.spacing(10),
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    '& h4': {
      textAlign: 'center',
    },
    paddingBottom: theme.spacing(10),
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    width: '20rem',
    height: '20rem',
    flexDirection: 'column',
    '&>div:last-child': {
      marginTop: 0,
      alignSelf: 'center',
    },
  },
  next: {},
  back: {},
  paddedPaper: {
    padding: theme.spacing(2),
  },
}));

function getSteps(gameType: GameType) {
  if (gameType === GameType.MultiTableTournament) {
    return ['Game type', 'Game duration', 'Options', 'Branding'];
  }

  return ['Game type', 'Game duration', 'Options', 'Scheduling'];
}

interface PricingRadioProps {
  name: string;
  description: string;
  actionMessage: string;
}

function StyledRadio(props: PricingRadioProps) {
  const classes = useStyles();
  const { actionMessage, ...radioProps } = props;

  return (
    <Card variant='outlined' style={{ flex: 1 }}>
      <CardHeader
        avatar={<Radio disableRipple color='default' {...radioProps} />}
        action={<div>{props.actionMessage}</div>}
        className={classes.card}
        title={props.name}
        subheader={props.description}
        // classes={}
      />
    </Card>
  );
}

function userSupportsGameType(user: IUserDetails, type: GameType) {
  if (type === GameType.MultiTableTournament) {
    return user.features && !!user.features.MULTI_TABLE;
  }
  return true;
}

function getGameTypeTitle(type: GameType) {
  switch (type) {
    case GameType.Cash:
      return 'Cash Game';
    case GameType.Tournament:
      return 'Tournament Mode';
    case GameType.MultiTableTournament:
      return 'Multi-Table';
  }
}
function getGameTypeDescription(type: GameType) {
  switch (type) {
    case GameType.Cash:
      return 'Contrary to the name, this doesn’t mean you have to pay. It just means players can enter and leave as they please. Free for up to 45 mins with 8 players. $8 after';
    case GameType.Tournament:
      return 'Play until last person standing.  No new players can enter the game once it is started. Free for up to 45 mins with 8 players.';
    case GameType.MultiTableTournament:
      return 'Tournament mode but bigger! Up to 200 players';
  }
}

export type onCreateSubmitPayload = {
  title: string;
  date: Date;
  buyInAmount: number;
  bigBlindAmount: number;
  blindIncreaseDuration: number;
  emails: string;
  mode: GameMode;
  payType: PayType;
  selectedDate: Date;
  timeZone: string;
  // Tournament mode
  registrationMode: TournamentRegistrationMode;
  winnerPayouts: number[];
  blindRounds: number[];
  roundInterval: number;
  rebuysThroughRound: number;
  startingStackAmount: number;
  startTimerInSeconds: number;
  rebuyTimeInSeconds: number;
  roundBreakFinalRebuyTimeInSeconds: number;
  topUpAmount: number;
  eliminationHangTimeInSeconds: number;
  lateRegistrationTimeInMinutes: number;
  timeoutInSeconds: number;
  minTableSizeBeforeRebalance: number;
  externalVideoConferencingLink: string;
  type: GameType;
  branding: BrandingType;
  rebuyOptions: IRebuyOptions;

  // Overflow rooms
  enableOverflowRooms: boolean;
  allowGuestsInOverflowRooms: boolean;
  overflowRoomUrl: string;

  // Perf features
  enablePerformantRebalances: boolean;
  enablePlayerWelcomeVideos: boolean;
  enableAutomation: boolean;
};

interface IProps {
  onSubmit: ((payload: onCreateSubmitPayload) => Promise<void>) | undefined;
  details?: Partial<onCreateSubmitPayload>;
}

const defaultExcludedGameModes = [GameMode.Poker501_8_180, GameMode.Poker501_8_45];
const isGameModeSupportedByPartner =
  miscOverrides && miscOverrides.isGameModeSupportedByPartner
    ? miscOverrides.isGameModeSupportedByPartner
    : (mode: GameMode, gameType: GameType) => defaultExcludedGameModes.indexOf(mode) < 0;

const explainerMessage =
  miscOverrides && miscOverrides.explainerMessage
    ? miscOverrides.explainerMessage
    : `This game is run by a solo-developer. I am passing on the costs
              for longer games. Give the free version a test and if you enjoy
              it, consider paying. Thanks!`;

function CreateGameFlow(props: IProps) {
  const classes = useStyles();
  const { userDetails } = useAppState();
  const [createInProgress, setCreateInProgress] = useState(false);
  const [activeStep, setActiveStep] = React.useState(props.details ? 2 : 0);
  const [skipped, setSkipped] = React.useState(new Set());
  const [buyInAmount, setBuyInAmount] = useState(props.details?.buyInAmount || 20);
  const [bigBlindAmount, setBigBlindAmount] = useState(props.details?.bigBlindAmount || 0.5);

  const [gameMode, setGameMode] = useState(props.details?.mode || GameMode.Premium_8_120);
  const [gameType, setGameType] = useState(props.details?.type || GameType.Cash);
  const [emails, setEmails] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    props.details?.selectedDate || nextHour(new Date()),
  );
  const [title, setTitle] = useState(props.details?.title || 'Video Poker Game');
  const [timeZone, setTimeZone] = useState(props.details?.timeZone || 'America/Los_Angeles');
  const [tournamentDetails, setTournamentDetails] = useState<ICreateTournamentDetails>(
    props.details
      ? ({ ...props.details, duration: 240 } as ICreateTournamentDetails)
      : {
          registrationMode: TournamentRegistrationMode.Open,
          startingStackAmount: 1000,
          winnerPayouts: [0.8, 0.2],
          blindRounds: [],
          rebuysThroughRound: -1,
          startTimerInSeconds: 10,
          rebuyTimeInSeconds: DEFAULT_REBUY_TIME_IN_SECONDS,
          topUpAmount: 1000,
          duration: 240,
          roundBreakFinalRebuyTimeInSeconds: DEFAULT_ROUND_BREAK_FINAL_REBUY_TIME_IN_SECONDS,
          eliminationHangTimeInSeconds: DEFAULT_ELIMINATION_HANG_TIME_IN_SECONDS,
          lateRegistrationTimeInMinutes: DEFAULT_LATE_REGISTRATION_TIME_IN_MINUTES,
          timeoutInSeconds: DEFAULT_TIMEOUT_IN_SECONDS,
          minTableSizeBeforeRebalance: DEFAULT_MIN_TABLE_SIZE_BEFORE_REBALANCE,
          externalVideoConferencingLink: '',
          // Overflow rooms
          enableOverflowRooms: false,
          allowGuestsInOverflowRooms: false,
          overflowRoomUrl: null,
          // Perf features
          enablePerformantRebalances: DEFAULT_ENABLE_PERFORMANT_REBALANCES,
          enablePlayerWelcomeVideos: DEFAULT_ENABLE_PLAYER_WELCOME_VIDEOS,
          enableAutomation: DEFAULT_ENABLE_AUTOMATION,
        },
  );
  const [branding, setBranding] = useState<BrandingType>(
    props.details?.branding || {
      tableImageUrl: tableLogo,
      registrationImageUrl: tableLogo,
      leftTableImageUrl: leftTableLogo,
      rightTableImageUrl: rightTableLogo,
      tournamentImageUrl: tournamentLogo,
      customTableLogos: [],
      playerListUrl: '',
      primaryColor: '',
      secondaryColor: '',
      customCss: '',
    },
  );
  const [rebuyOptions, setRebuyOptions] = useState<IRebuyOptions>(
    props.details?.rebuyOptions || {
      stack25: {
        value: null,
        active: false,
        stack: 0.25,
      },
      stack50: {
        value: null,
        active: false,
        stack: 0.5,
      },
      stack100: {
        value: null,
        active: false,
        stack: 1,
      },
    },
  );
  const steps = getSteps(gameType);

  const handleModeChanged = (value: GameMode) => {
    setGameMode(value);
    setTournamentDetails({
      ...tournamentDetails,
      duration: getMaximumDuration(value) / 60,
    });
  };

  useEffect(() => {
    if (!props.details) {
      setGameMode(null);
    }
  }, [gameType, props.details]);

  function getStepContent(step: number) {
    switch (step) {
      case 0:
        return (
          <div>
            <Typography variant='h4' component='h4'>
              Choose Game Type
            </Typography>
            <RadioGroup
              aria-label='product'
              id='product'
              name='product'
              value={gameType}
              onChange={value => {
                setGameType(value.currentTarget.value as GameType);
                handleNext();
              }}
              className={classes.products}
            >
              {Object.values(GameType)
                .filter(type => userSupportsGameType(userDetails, type))
                .map(type => (
                  <FormControlLabel
                    key={type}
                    data-pup={`gametype-${type}`}
                    className={`${type === gameType ? 'selected' : 'unselected'} ${
                      classes.marginlessLabel
                    }`}
                    value={type}
                    control={
                      <StyledRadio
                        name={getGameTypeTitle(type)}
                        description={getGameTypeDescription(type)}
                        actionMessage=''
                      />
                    }
                    label=''
                  />
                ))}
            </RadioGroup>
          </div>
        );
      case 1: {
        const supportedModes = Object.values(GameMode).filter(
          mode =>
            isGameModeSupportedByPartner(mode, gameType) && isGameModeSupported(mode, gameType),
        );
        return (
          <div>
            <Typography variant='h4' component='h4'>
              Choose Game Duration
            </Typography>
            <RadioGroup
              aria-label='product'
              id='product'
              name='product'
              value={gameMode}
              onChange={value => {
                handleModeChanged(value.currentTarget.value as GameMode);
                handleNext();
              }}
              className={classes.products}
            >
              {supportedModes.map(mode => (
                <FormControlLabel
                  key={mode}
                  data-pup={`gamemode-${mode}`}
                  className={`${mode === gameMode ? 'selected' : 'unselected'} ${
                    classes.marginlessLabel
                  }`}
                  value={mode}
                  control={
                    <StyledRadio
                      name={`${getMaximumParticipants(mode)} players for ${
                        getMaximumDuration(mode) / 60
                      } min`}
                      description={`Play for up to ${
                        getMaximumDuration(mode) / 60
                      } min with up to a maximum of ${getMaximumParticipants(mode)} players`}
                      actionMessage={
                        getModeCost(mode, undefined, userDetails.subscriptionType)
                          ? `$${getModeCost(
                              mode,
                              undefined,
                              userDetails.subscriptionType,
                            )} up front`
                          : getModeCostDescription(mode, undefined, userDetails.subscriptionType)
                      }
                    />
                  }
                  label=''
                />
              ))}
            </RadioGroup>
            <Typography style={{ margin: '1rem 0' }} variant='body1'>
              {explainerMessage}
            </Typography>
          </div>
        );
      }
      case 2:
        return (
          <div>
            <Typography variant='h4' component='h4'>
              Configure Game Play
            </Typography>

            <Paper elevation={1} className={classes.paddedPaper}>
              {gameType === GameType.Cash ? (
                <CashOptions
                  buyInAmount={buyInAmount}
                  setBuyInAmount={setBuyInAmount}
                  bigBlindAmount={bigBlindAmount}
                  setBigBlindAmount={setBigBlindAmount}
                />
              ) : (
                <TournamentOptions
                  type={GameType.Tournament}
                  details={tournamentDetails}
                  onChange={details => setTournamentDetails(details)}
                  buyInAmount={buyInAmount}
                  handleModeChanged={handleModeChanged}
                  mode={gameMode}
                  setBuyInAmount={setBuyInAmount}
                  perPlayer={false}
                  userDetails={userDetails}
                  rebuyOptions={rebuyOptions}
                  onRebuyChange={rebuy => {
                    console.log(rebuy);
                    setRebuyOptions(rebuy);
                  }}
                  title={title}
                  setTitle={setTitle}
                />
              )}
            </Paper>
          </div>
        );
      case 3: {
        return (
          <div>
            <Typography variant='h4' component='h4'>
              Configure Invites
            </Typography>

            <Paper elevation={1} className={classes.paddedPaper}>
              {gameType === GameType.MultiTableTournament ? (
                <BrandingOptions
                  branding={branding}
                  setBranding={setBranding}
                  gameType={gameType}
                />
              ) : (
                <>
                  <SchedulingOptions
                    title={title}
                    setTitle={setTitle}
                    timeZone={timeZone}
                    setTimeZone={setTimeZone}
                    emails={emails}
                    setEmails={setEmails}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                  />
                  {gameType === GameType.Cash &&
                  userDetails &&
                  userDetails.features?.CASH_BRANDING ? (
                    <BrandingOptions
                      branding={branding}
                      setBranding={setBranding}
                      gameType={gameType}
                    />
                  ) : null}
                </>
              )}
            </Paper>
          </div>
        );
      }
      default:
        return <div>Unknown step</div>;
    }
  }

  const isStepOptional = (step: number) => step === -1;

  const isStepSkipped = (step: number) => skipped.has(step);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      setCreateInProgress(true);
      const duration = tournamentDetails
        ? tournamentDetails.duration * 60
        : getMaximumDuration(gameMode);
      props
        .onSubmit({
          ...tournamentDetails,
          title,
          date: selectedDate,
          buyInAmount,
          bigBlindAmount,
          blindIncreaseDuration: 0,
          emails: emails.join(';'),
          mode: gameMode,
          payType: PayType.UpFront,
          selectedDate,
          timeZone,
          roundInterval: Math.floor(
            duration / Math.max(1, tournamentDetails.blindRounds.length) / 60,
          ),
          type: gameType,
          branding,
          rebuyOptions,
        })
        .then(() => setCreateInProgress(false));
      return;
    }

    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep(prevActiveStep => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => Math.max(props.details ? 2 : 0, prevActiveStep - 1));
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      // it should never occur unless someone's actively trying to break something.
      throw new Error("You can't skip a step that isn't optional.");
    }

    setActiveStep(prevActiveStep => prevActiveStep + 1);
    setSkipped(prevSkipped => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const isNextStepEnabled = () => {
    switch (activeStep) {
      case 0:
        return !!gameType;
      case 1:
        return !!gameMode;
      case 2: {
        if (gameType === GameType.Tournament) {
          return true;
        }
        return !!buyInAmount && !!bigBlindAmount;
      }
      case 3: {
        if (!branding.vimeoVideoUrl) {
          return true;
        }

        return validateVimeoUrl(branding.vimeoVideoUrl);
      }
    }
    return true;
  };

  const rebuyCorrectlySet = () => {
    let isCorrectVal = true;
    Object.keys(rebuyOptions).forEach(key => {
      if (
        rebuyOptions[key as keyof IRebuyOptions].active &&
        !rebuyOptions[key as keyof IRebuyOptions].value
      ) {
        isCorrectVal = false;
      }
    });
    return isCorrectVal;
  };

  let nextButtonTitle = 'Next';

  if (activeStep === steps.length - 1) {
    if (props.details) {
      nextButtonTitle = 'Save Changes';
    } else {
      nextButtonTitle = getModeCost(gameMode, PayType.UpFront) ? 'Finish and Pay' : 'Create';
    }
  }

  return (
    <div
      className={classes.root}
      id='create-game-flow'
      style={{ height: props.details ? '100%' : undefined }}
    >
      <div className={classes.stepperContent}>
        <div className={classes.stepperContent}>
          <Typography className={classes.instructions} component='div'>
            {getStepContent(activeStep)}
          </Typography>
          <div className={classes.stepperActions}>
            <Button
              variant='outlined'
              color='primary'
              disabled={activeStep === 0}
              onClick={handleBack}
              className={`${classes.button} ${classes.back}`}
              size='large'
            >
              Back
            </Button>
            {isStepOptional(activeStep) && (
              <Button
                variant='outlined'
                color='primary'
                onClick={handleSkip}
                className={classes.button}
                size='large'
              >
                Skip
              </Button>
            )}

            <Button
              variant='contained'
              color='secondary'
              onClick={handleNext}
              className={`${classes.button} ${classes.next}`}
              disabled={!isNextStepEnabled() || createInProgress || !rebuyCorrectlySet()}
              data-pup='creategameflow-next'
              size='large'
            >
              {nextButtonTitle}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditTournamentDialog({
  tournament,
  onClose,
}: {
  tournament: ITournamentDetails;
  onClose: { (): Promise<void> };
}) {
  const { user, setError } = useAppState();

  const details = tournament
    ? {
        title: tournament.name,
        buyInAmount: tournament.buyIn,
        bigBlindAmount: tournament.rounds[0].bigBlind,
        blindIncreaseDuration: tournament.roundInterval,
        mode: tournament.mode,
        type: tournament.type,
        // Tournament
        registrationMode: tournament.registrationMode,
        winnerPayouts: tournament.winners.map(w => w.percent),
        blindRounds: tournament.rounds.map(r => r.bigBlind),
        roundInterval: tournament.roundInterval,
        rebuysThroughRound: tournament.rebuysThroughRound,
        startingStackAmount: tournament.startingStack,
        topUpAmount: tournament.topUpAmount,
        branding: tournament.branding,
        startTimerInSeconds: tournament.startTimerInSeconds,
        rebuyTimeInSeconds: tournament.rebuyTimeInSeconds,
        roundBreakFinalRebuyTimeInSeconds: tournament.roundBreakFinalRebuyTimeInSeconds,
        eliminationHangTimeInSeconds: tournament.eliminationHangTimeInSeconds,
        lateRegistrationTimeInMinutes: tournament.lateRegistrationTimeInMinutes,
        timeoutInSeconds: tournament.timeoutInSeconds,
        minTableSizeBeforeRebalance: tournament.minTableSizeBeforeRebalance,
        externalVideoConferencingLink: tournament.externalVideoConferencingLink,
        rebuyOptions: tournament.rebuyOptions,
        enableOverflowRooms: tournament.enableOverflowRooms,
        allowGuestsInOverflowRooms: tournament.allowGuestsInOverflowRooms,
        // Perf features
        enablePerformantRebalances: tournament.enablePerformantRebalances,
        enablePlayerWelcomeVideos: tournament.enablePlayerWelcomeVideos,
        enableAutomation: tournament.enableAutomation,
        overflowRoomUrl: tournament.overflowRoomUrl,
      }
    : null;

  const onCreateGame = async ({
    title,
    buyInAmount,
    bigBlindAmount,
    blindIncreaseDuration,
    mode,
    type,
    // Tournament
    registrationMode,
    winnerPayouts,
    blindRounds,
    roundInterval,
    rebuysThroughRound,
    startingStackAmount,
    topUpAmount,
    startTimerInSeconds,
    rebuyTimeInSeconds,
    roundBreakFinalRebuyTimeInSeconds,
    eliminationHangTimeInSeconds,
    lateRegistrationTimeInMinutes,
    timeoutInSeconds,
    minTableSizeBeforeRebalance,
    externalVideoConferencingLink,
    rebuyOptions,
    enableOverflowRooms,
    allowGuestsInOverflowRooms,
    enablePerformantRebalances,
    enablePlayerWelcomeVideos,
    enableAutomation,
    overflowRoomUrl,
  }: onCreateSubmitPayload) => {
    const headers = new window.Headers();
    const idToken = await user!.getIdToken();
    headers.set('Authorization', `Bearer ${idToken}`);
    headers.set('Domain', document.location.hostname);

    const endpoint = `${process.env.REACT_APP_API_ENDPOINT}/tournament/edit`;

    const body: Partial<onCreateSubmitPayload> & { id: string } = {
      id: tournament.id,
      title,
      buyInAmount,
      bigBlindAmount,
      blindIncreaseDuration,
      mode,
      type,
      // Tournament
      registrationMode,
      winnerPayouts,
      blindRounds,
      roundInterval,
      rebuysThroughRound,
      startingStackAmount,
      topUpAmount,
      startTimerInSeconds,
      rebuyTimeInSeconds,
      roundBreakFinalRebuyTimeInSeconds,
      eliminationHangTimeInSeconds,
      lateRegistrationTimeInMinutes,
      timeoutInSeconds,
      minTableSizeBeforeRebalance,
      externalVideoConferencingLink,
      branding: {
        tableImageUrl: tournament.branding?.tableImageUrl,
        registrationImageUrl: tournament.branding?.registrationImageUrl,
        leftTableImageUrl: tournament.branding?.leftTableImageUrl,
        rightTableImageUrl: tournament.branding?.rightTableImageUrl,
        tournamentImageUrl: tournament.branding?.tournamentImageUrl,
        customTableLogos: tournament.branding?.customTableLogos,
        playerListUrl: tournament.branding?.playerListUrl,
        primaryColor: tournament.branding?.primaryColor,
        secondaryColor: tournament.branding?.secondaryColor,
        customCss: tournament.branding?.customCss,
      },
      rebuyOptions,
      enableOverflowRooms,
      allowGuestsInOverflowRooms,
      enablePerformantRebalances,
      enablePlayerWelcomeVideos,
      enableAutomation,
      overflowRoomUrl,
    };

    const json = await fetch(`${endpoint}`, {
      headers,
      method: 'POST',
      body: JSON.stringify(body),
    }).then(res => res.json());

    if (json.error) {
      setError({ message: json.error } as TwilioError);
    }

    onClose();
  };

  return (
    <ThemeProvider theme={theme}>
      <Dialog
        open={!!tournament}
        aria-labelledby='form-dialog-title'
        fullWidth
        maxWidth='xl'
        onClose={onClose}
      >
        <DialogTitle id='form-dialog-title'>Edit Tournament</DialogTitle>
        <DialogContent style={{ paddingLeft: 0, paddingRight: 0 }}>
          {details ? <CreateGameFlow onSubmit={onCreateGame} details={details} /> : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color='secondary'>
            Cancel
          </Button>
          <Button onClick={onClose} color='primary' data-pup='create-game'>
            Create Game
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default function () {
  const { user, setError } = useAppState();
  const history = useHistory();
  const stripe = useStripe();

  const onCreateGame = async ({
    title,
    date,
    buyInAmount,
    bigBlindAmount,
    blindIncreaseDuration,
    emails,
    mode,
    payType,
    selectedDate,
    timeZone,
    type,
    // Tournament
    registrationMode,
    winnerPayouts,
    blindRounds,
    roundInterval,
    rebuysThroughRound,
    startingStackAmount,
    topUpAmount,
    branding,
    startTimerInSeconds,
    rebuyTimeInSeconds,
    roundBreakFinalRebuyTimeInSeconds,
    eliminationHangTimeInSeconds,
    lateRegistrationTimeInMinutes,
    timeoutInSeconds,
    minTableSizeBeforeRebalance,
    externalVideoConferencingLink,
    rebuyOptions,
    // Overflow rooms
    enableOverflowRooms,
    allowGuestsInOverflowRooms,
    enablePerformantRebalances,
    enablePlayerWelcomeVideos,
    enableAutomation,
    overflowRoomUrl,
  }: onCreateSubmitPayload) => {
    const headers = new window.Headers();
    const idToken = await user!.getIdToken();
    headers.set('Authorization', `Bearer ${idToken}`);
    headers.set('Domain', document.location.hostname);

    const isTournament = type === GameType.Tournament || type === GameType.MultiTableTournament;
    const endpoint = isTournament
      ? `${process.env.REACT_APP_API_ENDPOINT}/tournament/create`
      : `${process.env.REACT_APP_API_ENDPOINT}/create`;

    const body = {
      title,
      date: date.toISOString(),
      buyInAmount,
      bigBlindAmount,
      blindIncreaseDuration,
      emails,
      mode,
      payType,
      type,
      code: getUrlVars().get('code') || '',
      startDate: moment(selectedDate).format('YYYY-MM-DDTHH:mm:ss'),
      timeZone,
      // Tournament
      registrationMode,
      winnerPayouts,
      blindRounds,
      roundInterval,
      rebuysThroughRound,
      startingStackAmount,
      topUpAmount,
      startTimerInSeconds,
      rebuyTimeInSeconds,
      roundBreakFinalRebuyTimeInSeconds,
      eliminationHangTimeInSeconds,
      lateRegistrationTimeInMinutes,
      timeoutInSeconds,
      minTableSizeBeforeRebalance,
      externalVideoConferencingLink,

      hostedMedia: getUrlVars().get('hostedMedia') || '',
      branding,
      rebuyOptions,

      enableOverflowRooms,
      overflowRoomUrl,
      allowGuestsInOverflowRooms,

      enablePerformantRebalances,
      enablePlayerWelcomeVideos,
      enableAutomation,

      // Debug
      version: {
        build: process.env.REACT_APP_BUILD_VERSION || 'unknown',
        date: process.env.REACT_APP_BUILD_DATE || 'unknown',
      },
    };

    const json = await fetch(`${endpoint}`, {
      headers,
      method: 'POST',
      body: JSON.stringify(body),
    }).then(res => res.json());

    if (json.error) {
      setError({ message: json.error } as TwilioError);
      return;
    }

    if (json.paymentSessionId) {
      await stripe.redirectToCheckout({
        sessionId: json.paymentSessionId,
      });
      return;
    }

    const organizer = type === GameType.MultiTableTournament ? '/organizer' : '?join';

    history.push(isTournament ? `/tournament/${json.id}${organizer}` : `/table/${json.id}?join`);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container className='home'>
        <FullPage>
          <Header mobileModeEnabled={false} />
          <CreateGameFlow onSubmit={onCreateGame} />
        </FullPage>
      </Container>
    </ThemeProvider>
  );
}
