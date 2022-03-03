import React, { memo, useRef } from "react";
import Slider from "react-slick";
import "../../../../../../node_modules/slick-carousel/slick/slick.css";
import "../../../../../../node_modules/slick-carousel/slick/slick-theme.css";
import {
  Favorite,
  Work,
  Star,
  Textsms,
  Lens,
} from "@material-ui/icons";

import { GroupIcon } from "../SvgIcons/GroupIcon";
import { CupIcon } from "../SvgIcons/CupIcon";
import { HandIcon } from "../SvgIcons/HandIcon";
import { BrandedIcon } from "../SvgIcons/BrandedIcon";
import { ScalableIcon } from "../SvgIcons/ScalableIcon";
import { FunIcon } from "../SvgIcons/FunIcon";
import { ActivitiesIcon } from "../SvgIcons/ActivitiesIcon";
import "./styles.css";

const SecondSectionSliderComponent = () => {
  const customSlider = useRef<Slider>(null);

  const settings = {
    speed: 500,
    dots: false,
    arrows: false,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
  };

  const nextSlider = () => {
    customSlider.current.slickNext();
  }
  const previousSlide = () => {
    customSlider.current.slickPrev();
  }

  return (
    <div className="second-section-slider">
      <Slider ref={slider => customSlider.current = slider}
        {...settings}
      >
        <div>
          <div className="slider-item first-slide">
            <h2 className="slider-title">Host A Corporate Event</h2>
            <div className="lists-wrap">
              <div className="list-wrap">
                <p className="list-title">Types of Events:</p>
                <ul className="list">
                  <li className="list-item">
                    <Favorite className="svg-icon" />
                    <p className="list-text">Charity Fundraisers</p>
                  </li>
                  <li className="list-item">
                    <Work className="svg-icon" />
                    <p className="list-text">Employee Engagements</p>
                  </li>
                  <li className="list-item">
                    <GroupIcon />
                    <p className="list-text">Member Associations</p>
                  </li>
                </ul>
              </div>
              <div className="list-wrap">
                <p className="list-title">Custom Add-ons:</p>
                <ul className="list">
                  <li className="list-item">
                    <Star className="svg-icon" />
                    <p className="list-text">Celebrity Poker Appearances</p>
                  </li>
                  <li className="list-item">
                    <Textsms className="svg-icon" />
                    <p className="list-text">Live Commentary</p>
                  </li>
                  <li className="list-item">
                    <CupIcon />
                    <p className="list-text">Prizes</p>
                  </li>
                </ul>
              </div>
            </div>
            <p className="slider-description">
              Contact us and let us make the planning process for your event simple and easy.
              Schedule your personalized tournament today!
            </p>
          </div>
        </div>
        <div>
          <div className="slider-item second-slide">
            <h2 className="slider-title">Let us be your partner!</h2>
            <p className="slider-description">No matter your goals,
            Poker501’s team of producers and event experts are here to help you plan the perfect tournament experience.
              We work from end-to-end to provide support and the best experience for:</p>
            <div className="lists-wrap">
              <div className="list-wrap">
                <ul className="list">
                  <li className="list-item">
                    <Lens className="svg-icon" />
                    <p className="list-text">Welcome and Intro</p>
                  </li>
                  <li className="list-item">
                    <Lens className="svg-icon" />
                    <p className="list-text">Brand Integration</p>
                  </li>
                  <li className="list-item">
                    <Lens className="svg-icon" />
                    <p className="list-text">Customizable Invites</p>
                  </li>
                  <li className="list-item">
                    <Lens className="svg-icon" />
                    <p className="list-text">Registration Assitance</p>
                  </li>
                  <li className="list-item">
                    <Lens className="svg-icon" />
                    <p className="list-text">Copy and Content</p>
                  </li>
                  <li className="list-item">
                    <Lens className="svg-icon" />
                    <p className="list-text">Programming Support</p>
                  </li>
                </ul>
              </div>
              <div className="list-wrap">
                <ul className="list">
                  <li className="list-item">
                    <Lens className="svg-icon" />
                    <p className="list-text">Tech Support</p>
                  </li>
                  <li className="list-item">
                    <Lens className="svg-icon" />
                    <p className="list-text">Pre-Event Activities</p>
                  </li>
                  <li className="list-item">
                    <Lens className="svg-icon" />
                    <p className="list-text">Poker School</p>
                  </li>
                  <li className="list-item">
                    <Lens className="svg-icon" />
                    <p className="list-text">Food Baskets</p>
                  </li>
                  <li className="list-item">
                    <Lens className="svg-icon" />
                    <p className="list-text">Surprise Guests</p>
                  </li>
                  <li className="list-item">
                    <Lens className="svg-icon" />
                    <p className="list-text">Non-Cash Pizes</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="slider-item third-slide">
            <h2 className="slider-title">Why Poker501</h2>
            <div className="lists-wrap">
              <div className="list-wrap">
                <ul className="list">
                  <li className="list-item">
                    <div className="list-item__heading">
                      <HandIcon />
                      <p className="list-title">Interactive:</p>
                    </div>
                    <p className="list-text">Participatory engagement</p>
                  </li>
                  <li className="list-item">
                    <div className="list-item__heading">
                      <GroupIcon />
                      <p className="list-title">Social:</p>
                    </div>
                    <p className="list-text">In-game Chats</p>
                  </li>
                  <li className="list-item">
                    <div className="list-item__heading">
                      <BrandedIcon />
                      <p className="list-title">Branded:</p>
                    </div>
                    <p className="list-text">Add Your Own Logo</p>
                  </li>
                </ul>
              </div>
              <div className="list-wrap">
                <ul className="list">
                  <li className="list-item">
                    <div className="list-item__heading">
                      <ScalableIcon />
                      <p className="list-title">Scalable:</p>
                    </div>
                    <p className="list-text">From 4 to 250 Players</p>
                  </li>
                  <li className="list-item">
                    <div className="list-item__heading">
                      <BrandedIcon />
                      <p className="list-title">Customizable:</p>
                    </div>
                    <p className="list-text">Have It Your Way</p>
                  </li>
                  <li className="list-item">
                    <div className="list-item__heading">
                      <FunIcon />
                      <p className="list-title">Fun:</p>
                    </div>
                    <p className="list-text">Pre-Events and Specials</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Slider>
      <button className="arrow-left arrow" onClick={previousSlide}>
        <img
          className="arrow-icon"
          src="/custom/poker501.com/slider-arrow-left.png"
          alt="arrow-icon"
        />
      </button>
      <button className="arrow-right arrow" onClick={nextSlider}>
        <img
          className="arrow-icon"
          src="/custom/poker501.com/slider-arrow-right.png"
          alt="arrow-icon"
        />
      </button>
    </div>
  );
};

export const SecondSectionSlider = memo(SecondSectionSliderComponent)
