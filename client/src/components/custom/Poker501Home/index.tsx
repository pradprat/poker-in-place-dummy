import React, { useState, useEffect, memo } from "react";
import ReactPlayer from "react-player";
import "./CustomHome.css";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Link,
} from "@material-ui/core";

import Header from "./components/Header";
import { SecondSectionSlider } from "./components/Slider";
import { AboutUs } from "./components/AboutUs";
import { StarIcon } from "./components/SvgIcons/StarIcon";
import PlayNowBtn from "./components/PlayNowBtn";

const HomeComponent = () => {
  const [showForm, setShowForm] = useState(false);
  const video = document.createElement("video");
  const supportsWebm = video.canPlayType("video/webm; codecs=\"vp8, vorbis\"");

  useEffect(() => {
    const script = document.createElement("script");

    script.src = "https://js.hs-scripts.com/9000686.js";
    script.async = true;

    const appendScript = () => {
      document.body.appendChild(script);
    };

    setTimeout(appendScript, 1000);

    return () => {
      script.parentNode?.removeChild(script);
    }
  }, []);

  const showContactForm = () => {
    setShowForm(true);
    // @ts-ignore
    window.hbspt.forms.create({
      region: "na1",
      portalId: "9000686",
      formId: "398f740e-a545-4c61-9ca7-86081100eeb2",
      target: "#form-dialog",
      onFormSubmitted: () => setShowForm(false),
    });
  };

  return (
    <div className="custom-home" id="home">
      <div className="main-wrapper">
        <Header />
        <section className="wrapper first-section">
          <h1 className="first-section__title">Test to Poker 501</h1>
          <p className="first-section__description">
            Welcome to Poker 501, a place to host a virtual charity poker
            event or play with your friends! With audio and video built
            directly into our platform, you can enjoy customizable
              single-player game-play or set-up tournaments for up to 250.{" "}
          </p>
          <PlayNowBtn />
        </section>
        {supportsWebm && (
          <ReactPlayer
            className="wrapper"
            controls={false}
            width="100%"
            height={500}
            loop
            autoPlay
            playing
            muted
            url="/custom/poker501.com/table.webm"
          />
        )}
        {!supportsWebm && (
          <img
            className="wrapper"
            src="/custom/poker501.com/table.png"
            alt="desk"
          />
        )}
      </div>

      <section className="second-section-wrapper" id="host-an-event">
        <div className="wrapper second-section">
          <SecondSectionSlider />
          <div className="hero">
            <img
              src="/custom/poker501.com/hero.png"
              alt="hero" className="hero__img"
            />
            <h2 className="hero__name">Maria Ho</h2>
            <StarIcon className="hero__icon" />
            <p className="hero__description">
              Our Superstar - Women in Poker Hall of Famer & TV Personality.
              Meet her on Poker Celebrity Appearances!
            </p>
            <Button
              className="MuiButton-root--dark"
              fullWidth
              onClick={showContactForm}
            >
              Book Now
            </Button>
          </div>
        </div>
      </section>

      <section className="third-section-wrapper">
        <div className="wrapper third-section">
          <div className="item first-bg">
            <img
              alt="img"
              className="item__img"
              src="/custom/poker501.com/action-1.png"
              width={156}
            />
            <p className="item__title">Host An <br /> Event</p>
            <Button
              fullWidth
              onClick={showContactForm}
              data-pup="contact"
            >
              Contact Us
            </Button>
          </div>
          <div className="item second-bg">
            <img
              alt="img"
              className="item__img"
              src="/custom/poker501.com/action-2.png"
              width={115}
            />
            <p className="item__title">Play With <br /> Friends</p>
            <PlayNowBtn />
          </div>
          <div className="item third-bg">
            <img
              alt="img"
              className="item__img"
              src="/custom/poker501.com/action-3.png"
              width={110}
            />
            <p className="item__title">Play Tournament <br /> Mode</p>
            <Button
              onClick={showContactForm}
              fullWidth
            >
              Coming soon
            </Button>
          </div>
        </div>
      </section>

      <AboutUs />

      <section className="chance-section-wrapper" id="chance-for-life">
        <div className="chance-section wrapper">
          <div className="chance-section__left">
            <Link href="https://chanceforlife.net/" target="_blank">
              <img
                className="chance-section__logo"
                src="/custom/poker501.com/cfl.png"
                alt="cfl"
              />
            </Link>
            <Button
              className="chance-section__btn"
              href="https://cfl.givesmart.com/"
              target="_blank"
              size="large"
              data-pup="donate"
            >
              Donate
            </Button>
          </div>
          <p className="chance-section__description">
            Poker501 proudly supports Chance for Life – a 501c3 benefitting pediatric cancer research with world class
            facilities and organizations such as Children’s National Health System, Alex’s Lemonade Stand, etc.
            Poker501 will contribute $5 for every game played. Since 2005, Chance for Life has used poker to raise awareness and
            funds for this important cause, highlighted by their annual, 800 person tournament at
            MGM National Harbor with over $9.3MM raised to-date. As COVID-19 evolved, Chance for Life needed a solution
            for their in-person event – Poker501 was born.
          </p>
          <img
            className="chance-section__child"
            src="/custom/poker501.com/child-cfl.png"
            alt="child"
          />
        </div>
      </section>

      <section className="footer-section-wrapper" id="footer">
        <div className="footer-section">
          <div className="footer-section__content">
            <Link href="#home" underline="none">
              <img
                className="footer-section__logo"
                src="/custom/poker501.com/poker501_logo-black-blue.png"
                alt="logo"
              />
            </Link>
            <div className="footer-section__social">
              <a
                href="https://www.instagram.com/playpoker501/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img alt="instagram" src="/custom/poker501.com/instagram.png" />
              </a>
              <a
                href="https://www.twitter.com/PPoker501/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img alt="twitter" src="/custom/poker501.com/twitter.png" />
              </a>
              <a
                href="https://www.facebook.com/Poker-501-105761097964720/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img alt="facebook" src="/custom/poker501.com/facebook.png" />
              </a>
            </div>
          </div>

          <div className="footer-section__divider" />

          <div className="footer-section__content">
            <div className="footer-section__links">
              <Link
                href="https://www.privacypolicyonline.com/live.php?token=LWt0grbzWkcqRZ9bDJi4xmZOhN8ckInc"
                target="_blank"
                underline="none"
              >
                Privacy Policy | Legal
              </Link>
              <Link
                underline="none"
                onClick={showContactForm}
              >
                Contact Us
              </Link>
            </div>
            <div>
              Poker 501 2021 | All Rights Reserved
            </div>
          </div>
        </div>
      </section>

      <Dialog
        PaperProps={{ style: { backgroundColor: "#fff" }, }}
        onClose={() => setShowForm(false)}
        aria-labelledby="customized-dialog-title"
        open={showForm}
      >
        <DialogTitle id="customized-dialog-title">
          Tournament Inquiry
        </DialogTitle>
        <DialogContent dividers id="form-dialog" />
      </Dialog>
    </div>
  );
}

const Home = memo(HomeComponent);

function WrappedHome() {
  return <Home />;
}

export default WrappedHome;
