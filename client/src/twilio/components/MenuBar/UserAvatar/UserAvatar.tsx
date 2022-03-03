import React from "react";
import Avatar from "@material-ui/core/Avatar";
import makeStyles from "@material-ui/styles/makeStyles";
import Person from "@material-ui/icons/Person";
import { StateContextType } from "../../../state";
import { MiscOverrides } from "../../../../theme";

const useStyles = makeStyles({
  red: {
    color: "white",
    backgroundColor: "#F22F46",
  },
});

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((text) => text[0])
    .join("")
    .toUpperCase();
}

export default function UserAvatar({
  user,
  menuIcon
}: {
  user: StateContextType["user"];
  menuIcon?: string;
}) {
  const classes = useStyles();
  const miscOverrides = MiscOverrides[window.location.hostname];
  const avatar =
    menuIcon ||
    (miscOverrides && miscOverrides.favIconPng ? miscOverrides.favIconPng : null);

  const imageUrl = avatar || user?.photoURL;

  return imageUrl ? (
    <Avatar src={imageUrl} />
  ) : null;
  // <Avatar className={classes.red}>
  //   {user.displayName ? getInitials(user.displayName) : <Person />}
  // </Avatar>
}
