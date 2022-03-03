import React, { memo, useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Button,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  History as ChangeHistoryIcon,
  HelpOutline,
} from "@material-ui/icons";
import Tooltip from "@material-ui/core/Tooltip";
import Backdrop from "@material-ui/core/Backdrop";
import SpeedDial from "@material-ui/lab/SpeedDial";
import SpeedDialIcon from "@material-ui/lab/SpeedDialIcon";
import SpeedDialAction from "@material-ui/lab/SpeedDialAction";

import ReactFeedbackDialog from "../react-feedback-dialog";
import ToggleFullscreenButton from "../../twilio/components/ToggleFullScreenButton/ToggleFullScreenButton";
import Menu from "../../twilio/components/MenuBar/Menu/Menu";
import { useAppState } from "../../twilio/state";
import FlipCameraIconButton from "../../twilio/components/MenuBar/FlipCameraButton/FlipCameraIconButton";
import { DeviceSelector } from "../../twilio/components/MenuBar/DeviceSelector/DeviceSelector";
import { DeviceSelectorButton } from "../../twilio/components/MenuBar/DeviceSelector/DeviceSelectorButton";
import { isMobile } from "../../twilio/utils";
import { MiscOverrides } from "../../theme";
import HeaderControls from "../Seat/Controls/HeaderControls";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setShouldShowRightDrawer } from "../../store/features/rightDrawer/rightDrawerSlice";

const drawerWidth = 250;
const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  rightMenuButton: {
    marginRight: theme.spacing(1),
  },
  title: {
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
  },
  titleLink: {
    color: "#fff",
    display: "none",
    alignItems: "center",
    "&>div": { marginRight: "0.5rem" },
    [theme.breakpoints.up("md")]: {
      display: "flex",
    }
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  rightDrawer: {
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  rightDrawerPaper: {
    width: "80vw",
    maxWidth: 900,
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: "flex-end",
  },
  drawerContent: {
    overflowX: "hidden",
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  drawerContentPadded: {
    padding: "1rem",
  },
  speedDial: {
    position: "absolute",
    top: theme.spacing(2),
    left: theme.spacing(2),
  },
  speedDialBackdrop: {
    zIndex: 100,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  speedDialIcon: {
    width: 32,
    height: 32,
    "& > svg": {
      fontSize: "32px",
    },
  },
  fabIcon: {
    // backgroundColor: 'blue',
    "& svg": {
      fontSize: "32px",
    },
  },
}));

export interface IDrawerItem {
  title: string;
  icon: React.ReactElement;
  callback: () => boolean;
}

export interface IProps {
  className?: string;
  title?: React.ReactNode;
  icon?: string;
  renderTitleAction?: () => React.ReactNode;
  renderVideoControls?: boolean;
  drawerItems?: IDrawerItem[];
  rightDrawerIcon?: React.ReactNode;
  rightDrawer?: {
    title?: string;
    render?: () => React.ReactNode;
    unpadded?: boolean;
  };
  mobileModeEnabled?: boolean;
  showDrawer?: boolean;
  variant?: "permanent" | "persistent" | "temporary";
  renderHeaderVideoControls?: boolean;
}

const Header = (props: IProps): JSX.Element => {
  const classes = useStyles();
  const [showDrawer, setShowDrawer] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAppState();
  const dispatch = useAppDispatch();

  const showRightDrawer = useAppSelector((state) => state.rightDrawer.shouldShowRightDrawer);

  const toggleDrawer = (): void => {
    setShowDrawer(!showDrawer);
  };
  const toggleRightDrawer = (): void => {
    dispatch(setShouldShowRightDrawer(!showRightDrawer));
  };

  const handleOpen = (): void => {
    setOpen(true);
  };
  const handleClose = (): void => {
    setOpen(false);
  };

  const renderRightDrawer = (): JSX.Element =>
    props.rightDrawer ? (
      <Drawer
        className={classes.rightDrawer}
        anchor="right"
        open={showRightDrawer}
        onClose={toggleRightDrawer}
        classes={{
          paper: classes.rightDrawerPaper,
        }}
      >
        <div className={classes.drawerHeader}>
          {props.rightDrawer.title && (
            <ListItemText primary={props.rightDrawer.title} />
          )}
          <IconButton onClick={toggleRightDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <div className={`${classes.drawerContent} ${props.rightDrawer.unpadded ? "" : classes.drawerContentPadded}`}>
          {props.rightDrawer.render()}
        </div>
      </Drawer>
    ) : null;

  if (isMobile && props.mobileModeEnabled) {
    return (
      <>
        <Backdrop open={open} className={classes.speedDialBackdrop} />
        <SpeedDial
          ariaLabel="Menu options"
          className={classes.speedDial}
          hidden={false}
          icon={<SpeedDialIcon className={classes.speedDialIcon} />}
          onClose={handleClose}
          onOpen={handleOpen}
          open={open}
          direction="down"
        >
          {props.renderVideoControls && <DeviceSelectorButton />}
          {toggleRightDrawer && open && props.rightDrawer ? (
            <SpeedDialAction
              icon={
                props.rightDrawerIcon ? (
                  props.rightDrawerIcon
                ) : (
                  <ChangeHistoryIcon />
                )
              }
              tooltipOpen
              tooltipTitle={props.rightDrawer.title}
              onClick={() => {
                handleClose();
                toggleRightDrawer();
              }}
              tooltipPlacement="right"
              FabProps={{
                size: "large",
                className: `MuiSpeedDialAction-fab ${classes.fabIcon}`,
              }}
            />
          ) : null}
          {props.drawerItems?.map((action) => (
            <SpeedDialAction
              key={action.title}
              icon={action.icon}
              tooltipTitle={action.title}
              tooltipOpen
              onClick={() => action.callback() && handleClose()}
              tooltipPlacement="right"
              FabProps={{
                size: "large",
                className: `MuiSpeedDialAction-fab ${classes.fabIcon}`,
              }}
            />
          ))}
        </SpeedDial>
        {renderRightDrawer()}
      </>
    );
  }

  const miscOverrides = MiscOverrides[window.location.hostname];
  const title =
    props.title ||
    (miscOverrides && miscOverrides.title
      ? miscOverrides.title
      : "Poker in Place");
  const icon =
    props.icon ||
    (miscOverrides && miscOverrides.favIconPng
      ? miscOverrides.favIconPng
      : null);
  const avatar =
    miscOverrides && miscOverrides.favIconPng ? miscOverrides.favIconPng : null;

  return (
    <AppBar position="sticky" className={props.className}>
      <Toolbar variant="dense">
        {props.drawerItems?.length ? (
          <IconButton
            edge="start"
            className={classes.menuButton}
            aria-label="menu"
            onClick={() => toggleDrawer()}
            title="Toggle Menu"
          >
            <MenuIcon />
          </IconButton>
        ) : null}
        <Typography variant="h6" className={classes.title}>
          <div className={classes.titleLink}>
            {typeof title === "string" && icon && (
              <Avatar src={avatar || icon} />
            )}
            {title}
          </div>
          {props.renderTitleAction && props.renderTitleAction()}
        </Typography>
        {props.renderHeaderVideoControls && <HeaderControls />}
        <Tooltip title="Send Feedback">
          <Button onClick={(ev: {}) => setShowFeedback(true)} size="large">
            <HelpOutline />
          </Button>
        </Tooltip>
        <ReactFeedbackDialog
          open={showFeedback}
          onClose={() => setShowFeedback(false)}
          publishConfig={{
            method: "mail",
            mailConfig: {
              EMAIL_SECURE_TOKEN: "dedabef0-3f77-4f13-9703-b5299a273802",
              EMAIL_TO: "nick@pokerinplace.app",
              EMAIL_FROM: "nick@pokerinplace.app",
            },
          }}
          additionalInfo={{
            name: user?.displayName,
            uid: user?.uid,
          }}
        />
        {props.renderVideoControls && <ToggleFullscreenButton />}
        {props.renderVideoControls && <FlipCameraIconButton />}
        {props.renderVideoControls && <DeviceSelector />}
        {props.rightDrawer && (
          <IconButton
            edge="end"
            className={classes.rightMenuButton}
            aria-label="menu"
            onClick={() => toggleRightDrawer()}
            title={props.rightDrawer.title}
          >
            {props.rightDrawerIcon ? (
              props.rightDrawerIcon
            ) : (
              <ChangeHistoryIcon />
            )}
          </IconButton>
        )}
        <Menu />
      </Toolbar>
      <Drawer
        className={classes.drawer}
        anchor="left"
        open={showDrawer || props.showDrawer}
        onClose={toggleDrawer}
        classes={{
          paper: classes.drawerPaper,
        }}
        variant={props.variant}
      >
        <div className={classes.drawerHeader}>
          <ListItemText primary="Poker501" />
          <IconButton onClick={toggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        {props.drawerItems?.map((item) => (
          <ListItem
            button
            key={item.title}
            onClick={() => item.callback() && toggleDrawer()}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.title} />
          </ListItem>
        ))}
      </Drawer>
      {renderRightDrawer()}
    </AppBar>
  );
};

export default memo(Header);