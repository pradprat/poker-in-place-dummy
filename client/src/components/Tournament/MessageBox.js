/* eslint-disable react/no-string-refs */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable react/no-this-in-sfc */
/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-unresolved */
import React from "react";
import {
  PhotoMessage,
  FileMessage,
  SystemMessage,
  LocationMessage,
  SpotifyMessage,
  ReplyMessage,
  Avatar,
  MessageBox,
} from "react-chat-elements";
import { FaForward } from "react-icons/fa";
import { IoIosDoneAll, IoMdTime } from "react-icons/io";
import { MdCheck, MdMessage } from "react-icons/md";
import { format } from "timeago.js";

export function shimMessageBox() {
  const classNames = require("classnames");
  SystemMessage.prototype.render = function render() {
    const { text, className, data } = this.props;
    return (
      <div className={classNames("rce-container-smsg", className)}>
        <div className={`rce-smsg ${data.videoUrl ? "video" : ""}`} style={{ maxWidth: data.videoUrl ? "inherit" : "80%" }}>
          {data && data.videoUrl && (
            <div className="rce-smsg-video">
              <video
                poster={data.videoUrl.replace(".mp4", ".jpg")}
                style={{ width: "100%", height: "100%" }}
                controls
              >
                <source src={data.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          {text && (<div className="rce-smsg-text">{text}</div>)}
        </div>
      </div>
    );
  };
  MessageBox.prototype.render = function render() {
    const positionCls = classNames("rce-mbox", {
      "rce-mbox-right": this.props.position === "right",
    });
    const thatAbsoluteTime =
      this.props.type !== "text" &&
      this.props.type !== "file" &&
      !(this.props.type === "location" && this.props.text);

    const dateText =
      this.props.date &&
      !Number.isNaN(this.props.date) &&
      (this.props.dateString || format(this.props.date));

    return (
      <div
        ref="message"
        className={classNames("rce-container-mbox", this.props.className)}
        onClick={this.props.onClick}
      >
        {this.props.renderAddCmp instanceof Function &&
          this.props.renderAddCmp()}
        {this.props.type === "system" ? (
          <SystemMessage text={this.props.text} data={this.props.data} />
        ) : (
          <div
            className={classNames(
              positionCls,
              { "rce-mbox--clear-padding": thatAbsoluteTime },
              { "rce-mbox--clear-notch": !this.props.notch },
              { "message-focus": this.props.focus }
            )}
          >
            <div
              className="rce-mbox-body"
              onContextMenu={this.props.onContextMenu}
            >
              {this.props.forwarded === true && (
                <div
                  className={classNames(
                    "rce-mbox-forward",
                    {
                      "rce-mbox-forward-right": this.props.position === "left",
                    },
                    { "rce-mbox-forward-left": this.props.position === "right" }
                  )}
                  onClick={this.props.onForwardClick}
                >
                  <FaForward />
                </div>
              )}

              {this.props.replyButton === true && (
                <div
                  className={
                    this.props.forwarded !== true
                      ? classNames(
                        "rce-mbox-forward",
                        {
                          "rce-mbox-forward-right":
                            this.props.position === "left",
                        },
                        {
                          "rce-mbox-forward-left":
                            this.props.position === "right",
                        }
                      )
                      : classNames(
                        "rce-mbox-forward",
                        {
                          "rce-mbox-reply-btn-right":
                            this.props.position === "left",
                        },
                        {
                          "rce-mbox-reply-btn-left":
                            this.props.position === "right",
                        }
                      )
                  }
                  onClick={this.props.onReplyClick}
                >
                  <MdMessage />
                </div>
              )}

              {(this.props.title || this.props.avatar) && (
                <div
                  style={
                    this.props.titleColor && { color: this.props.titleColor }
                  }
                  onClick={this.props.onTitleClick}
                  className={classNames("rce-mbox-title", {
                    "rce-mbox-title--clear": this.props.type === "text",
                  })}
                >
                  {this.props.avatar && (
                    <Avatar
                      letterItem={this.props.letterItem}
                      src={this.props.avatar}
                    />
                  )}
                  {this.props.title && <span>{this.props.title}</span>}
                </div>
              )}

              {this.props.reply && (
                <ReplyMessage
                  photoURL={this.props.reply.photoURL}
                  title={this.props.reply.title}
                  titleColor={this.props.reply.titleColor}
                  message={this.props.reply.message}
                  onClick={this.props.onReplyMessageClick}
                />
              )}

              {this.props.type === "text" && (
                <div className="rce-mbox-text">{this.props.text}</div>
              )}

              {this.props.type === "location" && (
                <LocationMessage
                  onOpen={this.props.onOpen}
                  data={this.props.data}
                  target={this.props.target}
                  href={this.props.href}
                  apiKey={this.props.apiKey}
                  src={this.props.src}
                  zoom={this.props.zoom}
                  markerColor={this.props.markerColor}
                  text={this.props.text}
                />
              )}

              {this.props.type === "photo" && (
                <PhotoMessage
                  onOpen={this.props.onOpen}
                  onDownload={this.props.onDownload}
                  onLoad={this.props.onLoad}
                  onPhotoError={this.props.onPhotoError}
                  data={this.props.data}
                  width={this.props.width}
                  height={this.props.height}
                  text={this.props.text}
                />
              )}

              {this.props.type === "file" && (
                <FileMessage
                  onOpen={this.props.onOpen}
                  onDownload={this.props.onDownload}
                  data={this.props.data}
                  text={this.props.text}
                />
              )}

              {this.props.type === "spotify" && (
                <SpotifyMessage
                  width={this.props.width}
                  height={this.props.height}
                  theme={this.props.theme}
                  view={this.props.view}
                  data={this.props.data}
                  uri={this.props.uri || this.props.text}
                />
              )}

              <div
                className={classNames(
                  "rce-mbox-time",
                  { "rce-mbox-time-block": thatAbsoluteTime },
                  { "non-copiable": !this.props.copiableDate }
                )}
                data-text={this.props.copiableDate ? undefined : dateText}
              >
                {this.props.copiableDate &&
                  this.props.date &&
                  !Number.isNaN(this.props.date) &&
                  (this.props.dateString || format(this.props.date))}
                {this.props.status && (
                  <span className="rce-mbox-status">
                    {this.props.status === "waiting" && <IoMdTime />}

                    {this.props.status === "sent" && <MdCheck />}

                    {this.props.status === "received" && <IoIosDoneAll />}

                    {this.props.status === "read" && (
                      <IoIosDoneAll color="#4FC3F7" />
                    )}
                  </span>
                )}
              </div>
            </div>

            {this.props.notch &&
              (this.props.position === "right" ? (
                <svg
                  className={classNames("rce-mbox-right-notch", {
                    "message-focus": this.props.focus,
                  })}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M0 0v20L20 0" />
                </svg>
              ) : (
                <div>
                  <svg
                    className={classNames("rce-mbox-left-notch", {
                      "message-focus": this.props.focus,
                    })}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <defs>
                      <filter id="filter1" x="0" y="0">
                        <feOffset
                          result="offOut"
                          in="SourceAlpha"
                          dx="-2"
                          dy="-5"
                        />
                        <feGaussianBlur
                          result="blurOut"
                          in="offOut"
                          stdDeviation="3"
                        />
                        <feBlend
                          in="SourceGraphic"
                          in2="blurOut"
                          mode="normal"
                        />
                      </filter>
                    </defs>
                    <path d="M20 0v20L0 0" filter="url(#filter1)" />
                  </svg>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  };
}
