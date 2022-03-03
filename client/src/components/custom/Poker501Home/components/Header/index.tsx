import React, { memo } from "react";
import {
  AppBar,
  Toolbar,
  Link,
} from "@material-ui/core";

import Menu from "../../../../../twilio/components/MenuBar/Menu/Menu";

import "./styles.css";

const Header = () => (
  <AppBar position="static" color="transparent" className="home-header">
    <Toolbar variant="dense">
      <Link className="title-link" href="#home">
        <img
          alt="Poker501"
          className="logo"
          src="/custom/poker501.com/poker501_logo-white.png"
        />
      </Link>
      <div className="navigation-right">
        <div className="navigation-links">
          <Link href="#host-an-event" underline="none">Host an Event</Link>
          <Link href="#about-us" underline="none">About Us</Link>
          <Link href="#chance-for-life" underline="none">Donate</Link>
        </div>
        <Menu menuIcon="/custom/poker501.com/favicon-white.png" />
      </div>
    </Toolbar>
  </AppBar>
)

export default memo(Header);
